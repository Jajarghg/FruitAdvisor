<!DOCTYPE html>
<html>
<head>
  <title>Smart Fruit Advisor</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
<div class="glass-panel">
    <h1>Smart Fruit Advisor</h1>
    <select id="goalSelect">
      <option value="">Select Health Goal</option>
      <option value="weight">Weight Loss</option>
      <option value="muscle">Muscle Gain</option>
      <option value="lowSugar">Low Sugar Diet</option>
    </select>
    <br>
    <button id="recommendBtn">Get Recommendation</button>
    <button id="backBtn">Back</button>
</div>
<h2>Recommended Fruits</h2>
<div id="result"></div>
<h2>My Saved Fruits</h2>
<ul id="list"></ul>
<script src="recommendations.js"></script>
</body>
</html>
