<script lang="ts">
  // simplified landing page script (no server data usage)
</script>

<section class="landing">
  <h1>Welcome to Recipe Finder</h1>
  <p>Search recipes by the ingredients you have on hand.</p>
  <div class="cta">
    <a href="/recipes" class="primary-link">Browse Recipes</a>
    <a href="/pantry" class="secondary-link">Manage My Pantry</a>
    <a href="/favorites" class="secondary-link">Favorite Recipes</a>
  </div>
</section>

<style>
  .landing { max-width: 840px; margin: 2rem auto; text-align: center; }
  .landing h1 { margin-bottom: 0.5rem; }
  .landing p { color: #555; }
  .cta { margin-top: 1.25rem; display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; }
  .primary-link { background: #007acc; color: #fff; padding: 0.6rem 1rem; border-radius: 6px; text-decoration: none; }
  .primary-link:hover { background: #005a9e; }
  .secondary-link { background: #f5f5f5; color: #333; padding: 0.6rem 1rem; border-radius: 6px; text-decoration: none; border: 1px solid #ddd; }
  .secondary-link:hover { background: #e9e9e9; }
</style>