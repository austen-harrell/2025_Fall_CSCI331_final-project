<script lang="ts">
  import type { PageData } from './$types';
  type Meal = {
    idMeal: string;
    strMeal: string;
    strMealThumb?: string;
  };
  type FullMeal = Meal & {
    strCategory?: string;
    strArea?: string;
    ingredients?: string[];
  };

  let categories: string[] = [];
  let meals: Meal[] = [];
  let detailedMeals: FullMeal[] = [];
  let search = '';
  let loadingLists = true;
  let loadingMeals = false;
  let errorMsg = '';
  export let data: PageData;
  let pantryIngredients: string[] = (data?.pantry ?? []).map((p: any) => `${p.ingredient}`.toLowerCase());
  let filterByPantry = false;
  let selectedPantry: string[] = [];
  let page = 1;
  const pageSize = 50;

  // Modal state for viewing a single recipe
  let showModal = false;
  let modalLoading = false;
  let modalError = '';
  let activeRecipe: any = null;
  let favorites: Set<string> = new Set((data?.favorites ?? []).map((f: any) => `${f.recipe_id}`));
  let favoritesOnly = false;
  let selectedCategory: string = '';
  let selectedArea: string = '';

  $: categoryOptions = Array.from(
    new Set([
      ...categories,
      ...detailedMeals.map((m) => m.strCategory ?? '').filter((v) => !!v)
    ])
  ).sort();
  // Areas: prefer cached list first, then derive from detailed meals
  $: areaOptions = (() => {
    try {
      const raw = typeof localStorage !== 'undefined' ? localStorage.getItem('recipes:areas') : null;
      if (raw) {
        const cached = JSON.parse(raw);
        if (Array.isArray(cached?.areas) && cached.areas.length > 0) {
          return cached.areas as string[];
        }
      }
    } catch {}
    return Array.from(new Set(detailedMeals.map((m) => m.strArea ?? '').filter((v) => !!v))).sort();
  })();

  // simple in-memory/localStorage cache for recipe detail
  const detailCache: Map<string, any> = new Map();
  function getCached(id: string): any | null {
    if (detailCache.has(id)) return detailCache.get(id);
    const raw = localStorage.getItem(`meal:${id}`);
    if (!raw) return null;
    try { const val = JSON.parse(raw); detailCache.set(id, val); return val; } catch { return null; }
  }
  function setCached(id: string, val: any) {
    detailCache.set(id, val);
    try { localStorage.setItem(`meal:${id}`, JSON.stringify(val)); } catch {}
  }

  async function openRecipe(idMeal: string) {
    showModal = true;
    modalLoading = true;
    modalError = '';
    activeRecipe = null;
    try {
      let meal = getCached(idMeal);
      if (!meal) {
        const res = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${encodeURIComponent(idMeal)}`);
        if (!res.ok) {
          modalError = 'Failed to load recipe.';
          return;
        }
        const json = await res.json();
        meal = json?.meals?.[0] ?? null;
        if (!meal) {
          modalError = 'Recipe not found.';
          return;
        }
        setCached(idMeal, meal);
      }
      // Build ingredients + measures arrays
      const ingredients: string[] = [];
      const measures: string[] = [];
      for (let k = 1; k <= 20; k++) {
        const ing = (meal[`strIngredient${k}`] ?? '').trim();
        const mea = (meal[`strMeasure${k}`] ?? '').trim();
        if (ing) {
          ingredients.push(ing);
          measures.push(mea);
        }
      }
      activeRecipe = {
        ...meal,
        ingredients,
        measures
      };
    } catch (e) {
      modalError = 'Network error while loading recipe.';
    } finally {
      modalLoading = false;
    }
  }
  async function toggleFavorite() {
    if (!activeRecipe) return;
    const id = activeRecipe.idMeal;
    const willFav = !favorites.has(id);
    try {
      const res = await fetch('/recipes/favorite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipe_id: id,
          recipe_name: activeRecipe.strMeal,
          thumb: activeRecipe.strMealThumb,
          favorite: willFav
        })
      });
      if (res.ok) {
        if (willFav) favorites.add(id); else favorites.delete(id);
        favorites = new Set(favorites);
      }
    } catch {}
  }

  function closeModal() {
    showModal = false;
    activeRecipe = null;
    modalError = '';
  }

  async function loadLists() {
    loadingLists = true;
    errorMsg = '';
    try {
      // Try cached lists first
      const raw = typeof localStorage !== 'undefined' ? localStorage.getItem('recipes:categories') : null;
      if (raw) {
        try {
          const cached = JSON.parse(raw);
          if (Array.isArray(cached?.categories)) {
            categories = cached.categories;
            loadingLists = false;
            return;
          }
        } catch {}
      }
      const [catRes] = await Promise.all([
        fetch('https://www.themealdb.com/api/json/v1/1/list.php?c=list')
      ]);
      if (!catRes.ok) {
        errorMsg = `Failed to load lists`;
        return;
      }
      const catJson = await catRes.json();
      categories = (catJson.categories ?? catJson.meals ?? [])
        .map((c: any) => c.strCategory)
        .filter((v: string) => !!v);
      try { localStorage.setItem('recipes:categories', JSON.stringify({ categories })); } catch {}
    } catch (e) {
      errorMsg = 'Network error while loading lists';
    } finally {
      loadingLists = false;
    }
  }

  async function loadMeals() {
    loadingMeals = true;
    errorMsg = '';
    try {
      // Try cached list of detailed meals first (with TTL)
      const raw = typeof localStorage !== 'undefined' ? localStorage.getItem('recipes:detailedMeals') : null;
      if (raw) {
        try {
          const cached = JSON.parse(raw);
          const age = Date.now() - (cached?.ts ?? 0);
          const ttlMs = 1000 * 60 * 30; // 30 minutes
          if (Array.isArray(cached?.data) && age < ttlMs) {
            detailedMeals = cached.data;
            loadingMeals = false;
            return;
          }
        } catch {}
      }
      // Fetch meals for every category and merge
      const results = await Promise.all(
        categories.map(async (c) => {
          try {
            const res = await fetch(`https://www.themealdb.com/api/json/v1/1/filter.php?c=${encodeURIComponent(c)}`);
            if (!res.ok) return [] as Meal[];
            const json = await res.json();
            return (json.meals ?? []) as Meal[];
          } catch {
            return [] as Meal[];
          }
        })
      );
      // Deduplicate meals by idMeal
      const map = new Map<string, Meal>();
      for (const arr of results) {
        for (const m of arr) map.set(m.idMeal, m);
      }
      meals = Array.from(map.values());

      // Enrich meals with controlled concurrency to avoid API limits
      detailedMeals = await enrichMeals(meals);
      try {
        localStorage.setItem('recipes:detailedMeals', JSON.stringify({ ts: Date.now(), data: detailedMeals }));
        const areas = Array.from(new Set(detailedMeals.map((m) => m.strArea ?? '').filter((v) => !!v))).sort();
        localStorage.setItem('recipes:areas', JSON.stringify({ areas }));
      } catch {}
    } catch (e) {
      errorMsg = 'Network error while loading meals';
    } finally {
      loadingMeals = false;
    }
  }

  async function lookupMeal(id: string): Promise<any | null> {
    try {
      const dRes = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${encodeURIComponent(id)}`);
      if (!dRes.ok) return null;
      const dJson = await dRes.json();
      return (dJson.meals?.[0] ?? null) as any;
    } catch {
      return null;
    }
  }

  async function enrichMeals(list: Meal[]): Promise<FullMeal[]> {
    const out: FullMeal[] = new Array(list.length);
    // Lower concurrency and add rate limiting to avoid API throttling
    const concurrency = 3;
    let idx = 0;
    let requests = 0;

    async function backoffLookup(id: string) {
      const maxAttempts = 3;
      let attempt = 0;
      let delayMs = 300;
      while (attempt < maxAttempts) {
        const d = await lookupMeal(id);
        if (d) return d;
        attempt++;
        await new Promise((r) => setTimeout(r, delayMs));
        delayMs *= 2;
      }
      return null;
    }

    async function worker() {
      while (idx < list.length) {
        const i = idx++;
        const m = list[i];
        // crude client-side rate limit: short pause every ~20 requests
        if (requests > 0 && requests % 20 === 0) {
          await new Promise((r) => setTimeout(r, 1000));
        }
        requests++;
        const detail = await backoffLookup(m.idMeal);
        if (!detail) {
          out[i] = { ...m } as FullMeal;
        } else {
          const ingredients: string[] = [];
          for (let k = 1; k <= 20; k++) {
            const val = (detail[`strIngredient${k}`] ?? '').trim();
            if (val) ingredients.push(val);
          }
          out[i] = {
            ...m,
            strCategory: detail.strCategory,
            strArea: detail.strArea,
            ingredients
          } as FullMeal;
        }
      }
    }
    const workers = Array.from({ length: Math.min(concurrency, list.length) }, () => worker());
    await Promise.all(workers);
    return out;
  }

  // Initial load of categories/areas
  loadLists();

  // Once categories are loaded, fetch all meals
  $: if (categories.length) {
    loadMeals();
  }

  // Client-side search filter over fetched meals
  $: visibleMeals = detailedMeals.filter((m) => {
    // Support comma-separated tokens; require each token matches at least one field
    const tokens = search
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t.length > 0);
    const fields = [
      `${m.strMeal}`.toLowerCase(),
      `${m.strCategory ?? ''}`.toLowerCase(),
      `${m.strArea ?? ''}`.toLowerCase(),
      ...(m.ingredients ?? []).map((i) => i.toLowerCase())
    ];
    const searchOk = tokens.length === 0 || tokens.every((tok) => fields.some((f) => f.includes(tok)));

    if (favoritesOnly && !favorites.has(m.idMeal)) return false;
    if (selectedCategory && `${m.strCategory ?? ''}`.toLowerCase() !== selectedCategory.toLowerCase()) return false;
    if (selectedArea && `${m.strArea ?? ''}`.toLowerCase() !== selectedArea.toLowerCase()) return false;
    if (!filterByPantry || selectedPantry.length === 0) return searchOk;
    const mealIngr = (m.ingredients ?? []).map((x) => x.toLowerCase());
    // require ALL selected pantry items to appear in meal ingredients (substring tolerant)
    const needs = selectedPantry.map((x) => x.toLowerCase());
    const hasAllSelected = needs.every((sel) => mealIngr.some((ing) => ing === sel || ing.includes(sel) || sel.includes(ing)));
    return searchOk && hasAllSelected;
  });

  // Reset page when search or pantry filters change
  $: page = 1, search, filterByPantry, selectedPantry, favoritesOnly, selectedCategory, selectedArea;

  // Paginated meals
  $: totalPages = Math.max(1, Math.ceil(visibleMeals.length / pageSize));
  $: startIdx = (page - 1) * pageSize;
  $: endIdx = startIdx + pageSize;
  $: pagedMeals = visibleMeals.slice(startIdx, endIdx);

  // Note: enrichment runs with controlled concurrency during initial load.
</script>

<section class="page">
  <h1>Browse Recipes</h1>
  <p>Aggregated recipes from all categories.</p>

  {#if loadingLists}
    <p>Loading category and area lists…</p>
  {/if}
  {#if errorMsg}
    <p class="error">{errorMsg}</p>
  {/if}

  <div class="filters">
    <input class="search" placeholder="Search name, category, area, ingredients" bind:value={search} />
    <label class="pantry-toggle"><input type="checkbox" bind:checked={filterByPantry} /> Look in my Pantry</label>
    <label class="pantry-toggle"><input type="checkbox" bind:checked={favoritesOnly} /> Favorites only</label>
    <select class="select" bind:value={selectedCategory}>
      <option value="">All Categories</option>
      {#if categoryOptions.length === 0}
        <option disabled>Loading categories…</option>
      {:else}
        {#each categoryOptions as c}
          <option value={c}>{c}</option>
        {/each}
      {/if}
    </select>
    <select class="select" bind:value={selectedArea}>
      <option value="">All Areas</option>
      {#if areaOptions.length === 0}
        <option disabled>Loading areas…</option>
      {:else}
        {#each areaOptions as a}
          <option value={a}>{a}</option>
        {/each}
      {/if}
    </select>
  </div>

  {#if filterByPantry}
    <div class="pantry-select">
      <label for="pantry-multi">Pantry items to include:</label>
      <select id="pantry-multi" multiple size="6" bind:value={selectedPantry}>
        {#each pantryIngredients as ing}
          <option value={ing}>{ing}</option>
        {/each}
      </select>
      <div class="pantry-actions">
        <button class="clear-btn" type="button" on:click={() => selectedPantry = []}>Clear selection</button>
        <p class="hint">Shows recipes containing all selected items.</p>
      </div>
    </div>
  {/if}

  <div class="table-wrap">
    <table class="table">
      <thead>
        <tr>
          <th>Thumbnail</th>
          <th>Recipe Name</th>
          <th>Category</th>
          <th>Area</th>
          <th>Ingredients</th>
        </tr>
      </thead>
      <tbody>
        {#if !loadingMeals && visibleMeals.length === 0}
          <tr><td colspan="5">No meals found.</td></tr>
        {:else}
        {#each pagedMeals as m}
          <tr class="clickable" on:click={() => openRecipe(m.idMeal)}>
            <td>{#if m.strMealThumb}<img class="thumb" src={m.strMealThumb} alt={m.strMeal} />{/if}</td>
            <td>{m.strMeal}</td>
            <td>{m.strCategory ?? ''}</td>
            <td>{m.strArea ?? ''}</td>
            <td>{m.ingredients?.join(', ') ?? ''}</td>
          </tr>
        {/each}
        {/if}
      </tbody>
    </table>
    <div class="pager">
      <button on:click={() => page = Math.max(1, page - 1)} disabled={page <= 1}>Prev</button>
      <span>Page {page} / {totalPages}</span>
      <button on:click={() => page = Math.min(totalPages, page + 1)} disabled={page >= totalPages}>Next</button>
    </div>
  </div>

  {#if showModal}
    <div class="backdrop" role="button" tabindex="0" aria-label="Close dialog" on:click={closeModal} on:keydown={(e) => (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') && closeModal()}></div>
    <div class="modal" role="dialog" aria-modal="true" aria-label="Recipe details">
      <button class="close" aria-label="Close" on:click={closeModal}>×</button>
      {#if modalLoading}
        <p>Loading recipe…</p>
      {:else if modalError}
        <p class="error">{modalError}</p>
      {:else if activeRecipe}
        <div class="recipe">
          <div class="header">
            {#if activeRecipe.strMealThumb}
              <img class="hero" src={activeRecipe.strMealThumb} alt={activeRecipe.strMeal} />
            {/if}
            <div class="meta">
              <h2 class="title">{activeRecipe.strMeal}</h2>
              <p><strong>Category:</strong> {activeRecipe.strCategory}</p>
              <p><strong>Country:</strong> {activeRecipe.strArea}</p>
              {#if activeRecipe.strSource}
                <p><strong>Source:</strong> <a class="link" href={activeRecipe.strSource} target="_blank" rel="noopener noreferrer">{activeRecipe.strSource}</a></p>
              {/if}
              {#if activeRecipe.strYoutube}
                <p><strong>Youtube:</strong> <a class="link" href={activeRecipe.strYoutube} target="_blank" rel="noopener noreferrer">{activeRecipe.strYoutube}</a></p>
              {/if}
            </div>
          </div>
          <div class="content">
            <div class="ingredients">
              <h3><strong>Ingredients</strong></h3>
              <ul>
                {#each activeRecipe.ingredients as ing, i}
                  <li>{ing}{#if activeRecipe.measures?.[i]} — {activeRecipe.measures[i]}{/if}</li>
                {/each}
              </ul>
            </div>
            <div class="instructions">
              <h3><strong>Instructions</strong></h3>
              <p>{activeRecipe.strInstructions}</p>
            </div>
          </div>
          <div class="actions">
            <button class={`fav ${favorites.has(activeRecipe.idMeal) ? 'is-fav' : ''}`} on:click={toggleFavorite}>
              {favorites.has(activeRecipe.idMeal) ? 'Unfavorite' : 'Favorite'}
            </button>
          </div>
        </div>
      {/if}
    </div>
  {/if}
</section>

<style>
  .page { max-width: 1100px; margin: 1.5rem auto; }
  .filters { display:flex; gap:.5rem; margin:1rem 0; }
  .search { flex:1; padding:.5rem .75rem; border:1px solid #ddd; border-radius:6px; }
  .pantry-toggle { display:flex; align-items:center; gap:.4rem; }
  select { padding:.5rem .75rem; border:1px solid #ddd; border-radius:6px; }
  .select { padding:.5rem .75rem; }
  .table-wrap { background:#fff; border:1px solid #e0e0e0; border-radius:8px; padding:1rem; }
  .table { width:100%; border-collapse: collapse; }
  .table th, .table td { padding:.5rem; border-bottom:1px solid #eee; vertical-align: top; }
  .thumb { width: 64px; height: 64px; object-fit: cover; border-radius:6px; }
  .error { color:#c33; }
  .pantry-select { display:flex; gap:.75rem; align-items:flex-start; margin:.5rem 0 1rem; }
  .pantry-select select { min-width: 240px; }
  .pantry-actions { display:flex; flex-direction: column; gap:.5rem; }
  .clear-btn { padding:.35rem .6rem; border:1px solid #ddd; border-radius:6px; background:#fafafa; cursor:pointer; }
  .clear-btn:hover { background:#f0f0f0; }
  .hint { color:#666; font-size:.85rem; }
  .pager { display:flex; gap:.75rem; align-items:center; justify-content:flex-end; padding-top:.75rem; }
  .pager button { padding:.35rem .6rem; }
  .clickable { cursor: pointer; }
  .backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.35); }
  .modal { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); width: min(900px, 95vw); max-height: 85vh; overflow: auto; background: #fff; border-radius: 10px; box-shadow: 0 12px 30px rgba(0,0,0,0.25); padding: 1rem 1.25rem; }
  .close { position: absolute; top: .5rem; right: .5rem; font-size: 1.5rem; background: transparent; border: none; cursor: pointer; }
  .recipe .header { display: flex; gap: 1rem; }
  .recipe .hero { width: 180px; height: 180px; object-fit: cover; border-radius: 8px; }
  .recipe .meta h2 { margin: 0 0 .25rem; }
  .title { font-size: 2rem; line-height: 1.2; }
  .link { text-decoration: none; border-bottom: 1px solid transparent; }
  .link:hover { text-decoration: underline; border-bottom-color: currentColor; }
  .content { display: grid; grid-template-columns: 1fr 2fr; gap: 1rem; margin-top: 1rem; }
  .ingredients ul { margin: .25rem 0 0; padding-left: 1.2rem; }
  .instructions p { white-space: pre-wrap; }
  .actions { display:flex; justify-content:flex-start; padding-top: .75rem; }
  .fav { padding: .5rem .9rem; border: 1px solid #ddd; border-radius: 20px; background: #fafafa; cursor: pointer; transition: all .15s ease-in-out; }
  .fav:hover { background: #f0f0f0; }
  .fav.is-fav { background: #ffe8e8; border-color: #e8b3b3; color: #b22; }
  .fav.is-fav:hover { background: #ffdcdc; }
  .page h1 {
    font-size: clamp(1.75rem, 2.2vw + 1rem, 3rem);
    line-height: 1.2;
    font-weight: 800;
    letter-spacing: 0.3px;
    color: #0f172a; /* slate-900 */
    position: relative;
  }
  .page h1::after {
    content: '';
    display: block;
    width: 72px;
    height: 3px;
    margin-top: 0.4rem;
    border-radius: 999px;
    background: linear-gradient(90deg, #007acc, #00b4d8);
  }
  @media (max-width: 700px) {
    .content { grid-template-columns: 1fr; }
    .recipe .header { flex-direction: column; }
    .recipe .hero { width: 100%; height: auto; }
  }
</style>