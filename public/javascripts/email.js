document.querySelector("#otpField").addEventListener("input", (event) => {
    document.querySelector("#verifyEmail").value = event.target.value;
})