<script lang="ts">
  type Meal = {
    idMeal: string;
    strMeal: string;
    strMealThumb?: string;
  };

  // This page currently does not use server data

  let mode: 'category' | 'area' = 'category';
  let categories: string[] = [];
  let areas: string[] = [];
  let selection = '';
  let meals: Meal[] = [];
  let search = '';
  let loadingLists = true;
  let loadingMeals = false;
  let errorMsg = '';

  async function loadLists() {
    loadingLists = true;
    errorMsg = '';
    try {
      const [catRes, areaRes] = await Promise.all([
        fetch('https://www.themealdb.com/api/json/v1/1/list.php?c=list'),
        fetch('https://www.themealdb.com/api/json/v1/1/list.php?a=list')
      ]);
      if (!catRes.ok || !areaRes.ok) {
        errorMsg = `Failed to load lists`;
        return;
      }
      const catJson = await catRes.json();
      const areaJson = await areaRes.json();
      categories = (catJson.categories ?? catJson.meals ?? [])
        .map((c: any) => c.strCategory)
        .filter((v: string) => !!v);
      areas = (areaJson.meals ?? [])
        .map((a: any) => a.strArea)
        .filter((v: string) => !!v);
    } catch (e) {
      errorMsg = 'Network error while loading lists';
    } finally {
      loadingLists = false;
    }
  }

  async function loadMeals() {
    if (!selection) {
      meals = [];
      return;
    }
    loadingMeals = true;
    errorMsg = '';
    try {
      const url =
        mode === 'category'
          ? `https://www.themealdb.com/api/json/v1/1/filter.php?c=${encodeURIComponent(selection)}`
          : `https://www.themealdb.com/api/json/v1/1/filter.php?a=${encodeURIComponent(selection)}`;
      const res = await fetch(url);
      if (!res.ok) {
        errorMsg = `Failed to load meals: ${res.status} ${res.statusText}`;
        return;
      }
      const json = await res.json();
      meals = (json.meals ?? []) as Meal[];
    } catch (e) {
      errorMsg = 'Network error while loading meals';
    } finally {
      loadingMeals = false;
    }
  }

  // Initial load of categories/areas
  loadLists();

  // Reactive: whenever mode or selection changes, refetch meals
  $: if (selection) {
    // debounce-like simple guard: trigger fetch when selection set
    loadMeals();
  }

  // Client-side search filter over fetched meals
  $: visibleMeals = meals.filter((m) =>
    `${m.strMeal}`.toLowerCase().includes(search.toLowerCase())
  );
</script>

<section class="page">
  <h1>Browse Recipes</h1>
  <p>Select a Category or an Area to fetch meals.</p>

  {#if loadingLists}
    <p>Loading category and area lists…</p>
  {/if}
  {#if errorMsg}
    <p class="error">{errorMsg}</p>
  {/if}

  <div class="filters">
    <div class="mode">
      <label><input type="radio" name="mode" value="category" bind:group={mode} /> Category</label>
      <label><input type="radio" name="mode" value="area" bind:group={mode} /> Area</label>
    </div>
    {#if mode === 'category'}
      <select bind:value={selection}>
        <option value="">Select Category…</option>
        {#each categories as c}
          <option value={c}>{c}</option>
        {/each}
      </select>
    {:else}
      <select bind:value={selection}>
        <option value="">Select Area…</option>
        {#each areas as a}
          <option value={a}>{a}</option>
        {/each}
      </select>
    {/if}
    <input class="search" placeholder="Search by meal name" bind:value={search} />
  </div>

  <div class="table-wrap">
    <table class="table">
      <thead>
        <tr>
          <th>Image</th>
          <th>Name</th>
        </tr>
      </thead>
      <tbody>
        {#if !loadingMeals && selection && visibleMeals.length === 0}
          <tr><td colspan="3">No meals found.</td></tr>
        {:else}
        {#each visibleMeals as m}
          <tr>
            <td>{#if m.strMealThumb}<img class="thumb" src={m.strMealThumb} alt={m.strMeal} />{/if}</td>
            <td>{m.strMeal}</td>
          </tr>
        {/each}
        {/if}
      </tbody>
    </table>
  </div>
</section>

<style>
  .page { max-width: 1100px; margin: 1.5rem auto; }
  .filters { display:flex; gap:.5rem; margin:1rem 0; }
  .mode { display:flex; gap:1rem; align-items:center; padding-right:.5rem; }
  .search { flex:1; padding:.5rem .75rem; border:1px solid #ddd; border-radius:6px; }
  select { padding:.5rem .75rem; border:1px solid #ddd; border-radius:6px; }
  .table-wrap { background:#fff; border:1px solid #e0e0e0; border-radius:8px; padding:1rem; }
  .table { width:100%; border-collapse: collapse; }
  .table th, .table td { padding:.5rem; border-bottom:1px solid #eee; vertical-align: top; }
  .thumb { width: 64px; height: 64px; object-fit: cover; border-radius:6px; }
  .error { color:#c33; }
</style>