const { ipcRenderer } = require('electron');

document.addEventListener("DOMContentLoaded", () => {
  const goalSelect = document.getElementById("goalSelect");
  const recommendBtn = document.getElementById("recommendBtn");
  const resultDiv = document.getElementById("result");
  const list = document.getElementById("list");
  const backBtn = document.getElementById("backBtn");

  if (backBtn) {
    backBtn.addEventListener("click", () => {
        ipcRenderer.send("go-back-main");
    });
  }

  // RECOMMENDATION LOGIC
  recommendBtn.addEventListener("click", () => {
    const goal = goalSelect.value;
    if (!goal) { 
      alert("Please select a health goal!"); 
      return; 
    }

    fetch("https://www.fruityvice.com/api/fruit/all")
      .then(res => res.json())
      .then(data => {
        let filtered = [];
        if (goal === "weight") filtered = data.filter(f => f.nutritions.calories < 50 && f.nutritions.sugar < 10);
        if (goal === "muscle") filtered = data.filter(f => f.nutritions.carbohydrates > 10);
        if (goal === "lowSugar") filtered = data.sort((a, b) => a.nutritions.sugar - b.nutritions.sugar).slice(0, 5);
        
        displayRecommendations(filtered, goal);
      });
  });

  function displayRecommendations(data, goal) {
    resultDiv.innerHTML = "";
    data.slice(0, 5).forEach(fruit => {
      const div = document.createElement("div");
      
      // RECOMENDED FRUIT
      div.innerHTML = `
        <div style="text-align: center;">
          <h3 style="margin: 0 0 5px 0; color: #5c1d3b; font-size: 20px;">${fruit.name}</h3>
          <em style="font-size: 13px; color: #888;">(${fruit.family})</em>
          <p style="margin: 15px 0; font-size: 14px; color: #444;">
            Cals: ${fruit.nutritions.calories}</p>
            <p>Sugar: ${fruit.nutritions.sugar}g
          </p>
          <button class="save-btn" style="background-color: #842e60; color: white; padding: 8px 20px; border-radius: 20px; border: none; cursor: pointer; font-family: 'Poppins', sans-serif; margin-top: 5px;">Save</button>
        </div>
      `;

      div.querySelector(".save-btn").addEventListener("click", () => {
        ipcRenderer.send("save-recommendation", {
          fruit: fruit.name,
          family: fruit.family, 
          genus: fruit.genus,   
          goal: goalSelect.options[goalSelect.selectedIndex].text,
          nutritions: fruit.nutritions, 
          servings: 1 
        });
        alert("Saved to your list!");
        loadData();
      });

      resultDiv.appendChild(div);
    });
  }

  // LOAD SAVED RECOMMENDATIONS
  async function loadData() {
    const data = await ipcRenderer.invoke("load-recommendations");
    list.innerHTML = "";

    let totalCalories = 0;
    let totalServings = 0;

    data.forEach((item, index) => {
      const li = document.createElement("li");

      const caloriesPerServing = item.nutritions?.calories ?? 0;
      const itemTotalCals = caloriesPerServing * item.servings;
      
      totalCalories += itemTotalCals;
      totalServings += parseInt(item.servings);

      const totalCalsFixed = itemTotalCals.toFixed(2);
      const sugar = item.nutritions?.sugar ?? 0;
      const protein = item.nutritions?.protein ?? 0;
      const carbs = item.nutritions?.carbohydrates ?? 0;
      const fat = item.nutritions?.fat ?? 0;
      
      const familyName = item.family ? item.family : "Unknown Family";
      const genusName = item.genus ? item.genus : "Unknown Genus";

      // --- NEW HORIZONTAL CHIC DESIGN ---
      li.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; width: 100%; text-align: left; padding: 5px;">
          
          <div style="flex: 1;">
            <div style="display: flex; align-items: center; margin-bottom: 5px;">
              <h3 style="margin: 0 10px 0 0; color: #5c1d3b; font-size: 24px; font-weight: 800;">${item.fruit}</h3>
              <span style="font-size: 12px; background: #fbe8f2; padding: 4px 12px; border-radius: 12px; color: #842e60;">${item.goal}</span>
            </div>
            <div style="font-size: 14px; color: #888; font-style: italic; margin-bottom: 8px;">
              Family: ${familyName} | Genus: ${genusName}
            </div>
            <div style="font-size: 14px; color: #666;">
              Sugar: ${sugar}g | Protein: ${protein}g | Carbs: ${carbs}g | Fat: ${fat}g
            </div>
          </div>

          <div style="margin: 0 20px; text-align: center;">
            <div style="font-size: 14px; color: #888; font-weight: bold; margin-bottom: 8px;">Servings</div>
            <input type="number" class="servInput" value="${item.servings}" min="1" style="width: 60px; text-align: center; border-radius: 10px; padding: 8px; border: 2px solid #fbe8f2; font-family: 'Poppins', sans-serif; font-size: 16px; outline: none; background: white;">
          </div>

          <div style="text-align: right; min-width: 160px;">
            <div style="color: #ff7b54; font-size: 21px; font-weight: 800; margin-bottom: 12px;">${totalCalsFixed} kcal</div>
            <div style="display: flex; justify-content: flex-end; gap: 8px;">
              <button class="updateBtn" style="background-color: #842e60; color: white; border: none; padding: 8px 16px; border-radius: 20px; font-size: 13px; font-weight: bold; cursor: pointer; font-family: 'Poppins', sans-serif;">Update</button>
              <button class="deleteBtn" style="background-color: #e56b6f; color: white; border: none; padding: 8px 16px; border-radius: 20px; font-size: 13px; font-weight: bold; cursor: pointer; font-family: 'Poppins', sans-serif;">Delete</button>
            </div>
          </div>

        </div>
      `;

      li.querySelector(".updateBtn").addEventListener("click", () => {
        const newServings = parseInt(li.querySelector(".servInput").value);
        if (isNaN(newServings) || newServings < 1) {
          alert("Please enter a valid quantity (1 or more).");
          return;
        }
        ipcRenderer.send("update-recommendation", { index: index, servings: newServings });
        alert("Quantity updated!");
        loadData(); 
      });

      li.querySelector(".deleteBtn").addEventListener("click", () => {
        ipcRenderer.send("delete-recommendation", index);
        loadData();
      });

      list.appendChild(li);
    });

    updateSummaryBox(totalCalories, totalServings, data.length);
  }

  function updateSummaryBox(totalCalories, totalServings, uniqueFruitsCount) {
    let summaryBox = document.getElementById("calorieSummary");
    
    if (!summaryBox) {
      summaryBox = document.createElement("div");
      summaryBox.id = "calorieSummary";
      summaryBox.style.background = "rgba(255, 255, 255, 0.85)";
      summaryBox.style.backdropFilter = "blur(10px)";
      summaryBox.style.border = "1px solid rgba(255, 255, 255, 0.6)";
      summaryBox.style.padding = "15px";
      summaryBox.style.borderRadius = "20px";
      summaryBox.style.boxShadow = "0 8px 20px rgba(0, 0, 0, 0.1)";
      summaryBox.style.width = "85%";
      summaryBox.style.maxWidth = "800px";
      summaryBox.style.margin = "0 auto 20px auto"; 
      summaryBox.style.color = "#842e60";
      summaryBox.style.fontSize = "16px";
      summaryBox.style.lineHeight = "1.6";
      
      list.parentNode.insertBefore(summaryBox, list);
    }

    let averageCalories = 0;
    if (totalServings > 0) {
      averageCalories = (totalCalories / totalServings).toFixed(2);
    }

    if (uniqueFruitsCount === 0) {
       summaryBox.innerHTML = "<em>Your saved list is empty. Add some fruits to calculate your intake!</em>";
    } else {
       summaryBox.innerHTML = `
         <strong>Total Servings:</strong> ${totalServings} <br>
         <strong>Total Calorie Intake:</strong> ${totalCalories.toFixed(2)} kcal <br>
         <strong>Average Calories per Serving:</strong> ${averageCalories} kcal
       `;
    }
  }

  loadData();
});