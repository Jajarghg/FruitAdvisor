const { ipcRenderer } = require('electron');

document.addEventListener("DOMContentLoaded", () => {
  const fruitInput = document.getElementById('fruitInput');
  const searchBtn = document.getElementById('searchBtn');
  const sugarBtn = document.getElementById('sugarBtn');
  const recommendBtn = document.getElementById('recommendBtn');
  const resultDiv = document.getElementById('result');
  let fruitsData = [];

  recommendBtn.addEventListener('click', () => {
    ipcRenderer.send('open-recommendation-window');
  });

  fetch('https://www.fruityvice.com/api/fruit/all')
    .then(res => res.json())
    .then(data => {
      fruitsData = data;
      displayFruits(data);
    })
    .catch(() => alert("Failed to load fruits."));

  searchBtn.addEventListener('click', () => {
    const query = fruitInput.value.trim().toLowerCase();
    if (!query) { displayFruits(fruitsData); return; }
    const filtered = fruitsData.filter(f => f.name.toLowerCase().includes(query));
    if (filtered.length === 0) { resultDiv.innerHTML = "<p>No fruits found.</p>"; return; }
    displayFruits(filtered);
  });

  sugarBtn.addEventListener('click', () => {
    if (fruitsData.length === 0) return;
    const highest = fruitsData.reduce((max, f) => f.nutritions.sugar > max.nutritions.sugar ? f : max);
    alert(`Highest Sugar Fruit: ${highest.name} (${highest.nutritions.sugar}g)`);
  });

  function displayFruits(data) {
    resultDiv.innerHTML = "";
    data.forEach(fruit => {
      const card = document.createElement("div");
      card.classList.add("card");
      card.innerHTML = `
        <h3 style="margin-bottom: 5px; color: #5c1d3b;">${fruit.name}</h3>
        <p style="font-size: 13px; color: #666; font-style: italic; margin-top: 0; margin-bottom: 15px;">
          Family: ${fruit.family} | Genus: ${fruit.genus}
        </p>
        <p><strong>Calories:</strong> ${fruit.nutritions.calories}</p>
        <p><strong>Sugar:</strong> ${fruit.nutritions.sugar}g</p>
        <p><strong>Protein:</strong> ${fruit.nutritions.protein}g</p>
        <p><strong>Fat:</strong> ${fruit.nutritions.fat}g</p>
        <p><strong>Carbs:</strong> ${fruit.nutritions.carbohydrates}g</p>
        <button class="saveBtn">Save to My List</button>
      `;

      card.querySelector(".saveBtn").addEventListener("click", () => {
        ipcRenderer.send("save-recommendation", {
          fruit: fruit.name,
          family: fruit.family,
          genus: fruit.genus,
          goal: "Saved",
          nutritions: fruit.nutritions,
          servings: 1
        });
        alert(`${fruit.name} saved successfully!`);
        ipcRenderer.send('open-recommendation-window');
      });
      resultDiv.appendChild(card);
    });
  }
});