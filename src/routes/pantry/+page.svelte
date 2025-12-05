<script lang="ts">
  import { enhance } from '$app/forms';
  export let data: { items: Array<{ id: number; ingredient: string; thumb?: string }> };

  let catalog: Array<{ strIngredient: string; strThumb?: string }> = [];
  let filter = '';
  // Build a quick lookup of pantry ingredients to filter catalog
  $: pantrySet = new Set(data.items.map((i) => i.ingredient.toLowerCase()));
  $: filteredCatalog = catalog
    .filter((c) => !pantrySet.has(c.strIngredient.toLowerCase()))
    .filter((c) => c.strIngredient.toLowerCase().includes(filter.toLowerCase()));

  async function loadCatalog() {
    const res = await fetch('https://www.themealdb.com/api/json/v1/1/list.php?i=list');
    const json = await res.json();
    catalog = (json.meals || []).map((m: any) => ({ strIngredient: m.strIngredient, strThumb: m.strThumb }));
  }

  loadCatalog();
</script>

<section class="page">
  <h1>Manage Your Pantry</h1>

  <div class="controls">
    <input class="search" placeholder="Search ingredients..." bind:value={filter} />
  </div>

  <div class="tables">
    <div class="table-wrap">
      <h2>Available Ingredients</h2>
      <table class="table">
        <thead>
          <tr><th>Ingredient</th><th>Image</th><th></th></tr>
        </thead>
        <tbody>
          {#each filteredCatalog as c}
            <tr>
              <td>{c.strIngredient}</td>
              <td>{#if c.strThumb}<img src={c.strThumb} alt={c.strIngredient} class="thumb" />{/if}</td>
              <td>
                <form method="POST" action="?/add" use:enhance>
                  <input type="hidden" name="ingredient" value={c.strIngredient} />
                  <input type="hidden" name="thumb" value={c.strThumb ?? ''} />
                  <button class="btn" type="submit">Add</button>
                </form>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    <div class="table-wrap">
      <h2>My Pantry</h2>
      <table class="table">
        <thead>
          <tr><th>Ingredient</th><th>Image</th><th></th></tr>
        </thead>
        <tbody>
          {#each data.items as item}
            <tr>
              <td>{item.ingredient}</td>
              <td>{#if item.thumb}<img src={item.thumb} alt={item.ingredient} class="thumb" />{/if}</td>
              <td>
                <form method="POST" action="?/remove" use:enhance>
                  <input type="hidden" name="id" value={item.id} />
                  <button class="btn danger" type="submit">Remove</button>
                </form>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>
</section>

<style>
  .page { max-width: 1000px; margin: 1.5rem auto; }
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
  .controls { margin: 1rem 0; }
  .search { width: 100%; max-width: 400px; padding: .5rem .75rem; border:1px solid #ddd; border-radius:6px; }
  .tables { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
  .table-wrap { background:#fff; border:1px solid #e0e0e0; border-radius:8px; padding:1rem; }
  .table { width: 100%; border-collapse: collapse; }
  .table th, .table td { padding:.5rem; border-bottom:1px solid #eee; vertical-align: middle; }
  .thumb { width: 40px; height: 40px; object-fit: cover; border-radius:4px; }
  .btn { background:#007acc; color:#fff; border:1px solid #007acc; border-radius:6px; padding:.3rem .6rem; cursor:pointer; }
  .btn:hover { background:#005a9e; }
  .btn.danger { background:#dc3545; border-color:#dc3545; }
  .btn.danger:hover { background:#c82333; }

  @media (max-width: 900px) { .tables { grid-template-columns: 1fr; } }
</style>