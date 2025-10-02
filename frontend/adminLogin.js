document.getElementById("loginBtn").addEventListener("click", async () => {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const errorMsg = document.getElementById("errorMsg");

  try {
    const res = await fetch("http://localhost:5000/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (res.ok) {
      localStorage.setItem("adminToken", data.token); // store admin JWT
      window.location.href = "/adminDashboard"; // correct
    } else {
      errorMsg.innerText = data.message || "Invalid credentials";
    }
  } catch (err) {
    console.error(err);
    errorMsg.innerText = "Server error, try again later.";
  }
});
