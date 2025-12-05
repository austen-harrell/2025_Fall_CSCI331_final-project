<script lang="ts">
</script>

<section class="landing">
  <h1>Welcome to your Pantry</h1>
  <p>Search recipes by the ingredients you have on hand.</p>
  <div class="cta">
    <a href="/recipes" class="primary-link">Browse Recipes</a>
    <a href="/pantry" class="primary-link">Manage My Pantry</a>
  </div>
</section>

<style>
  .landing { max-width: 840px; margin: 2rem auto; text-align: center; }
  .landing h1 {
    margin-bottom: 0.5rem;
    font-size: clamp(2rem, 3.5vw + 1rem, 3.5rem);
    line-height: 1.15;
    font-weight: 800;
    letter-spacing: 0.5px;
    background: linear-gradient(90deg, #007acc 0%, #00b4d8 50%, #7c3aed 100%);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }
  .landing h1::after {
    content: '';
    display: block;
    width: 80px;
    height: 4px;
    margin: 0.6rem auto 0;
    border-radius: 999px;
    background: linear-gradient(90deg, #007acc, #00b4d8);
  }
  .landing p { color: #555; }
  .cta { margin-top: 1.25rem; display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; }
  .primary-link { background: #007acc; color: #fff; padding: 0.6rem 1rem; border-radius: 6px; text-decoration: none; }
  .primary-link:hover { background: #005a9e; }
</style>