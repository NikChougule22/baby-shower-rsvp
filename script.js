const guestName = document.getElementById("guestName");
const guestCount = document.getElementById("guestCount");
const yesBtn = document.getElementById("yesBtn");
const noBtn = document.getElementById("noBtn");
const statusBox = document.getElementById("status");
const alreadyBox = document.getElementById("alreadyBox");

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwkeC2GJgP8sgcrRQF9DM3T4iWKFeFMrqU0EAv2j5ucdChFO5xCqheXgbtqMSTy-OBF/exec";

const DEVICE_KEY = "babyShowerRSVPDeviceId";
const RSVP_DONE_KEY = "babyShowerRSVPSubmitted";

function getOrCreateDeviceId() {
  let id = localStorage.getItem(DEVICE_KEY);
  if (!id) {
    id = "dev_" + Date.now() + "_" + Math.random().toString(36).slice(2, 12);
    localStorage.setItem(DEVICE_KEY, id);
  }
  return id;
}

function isAlreadySubmitted() {
  return localStorage.getItem(RSVP_DONE_KEY) === "true";
}

function setSubmitted() {
  localStorage.setItem(RSVP_DONE_KEY, "true");
}

function disableFormPermanently() {
  guestName.disabled = true;
  guestCount.disabled = true;
  yesBtn.disabled = true;
  noBtn.disabled = true;
  alreadyBox.style.display = "block";
}

function updateButtons() {
  if (isAlreadySubmitted()) {
    disableFormPermanently();
    return;
  }

  const hasName = guestName.value.trim().length > 0;
  yesBtn.disabled = !hasName;
  noBtn.disabled = !hasName;
}

function setBusyState(message) {
  guestName.disabled = true;
  guestCount.disabled = true;
  yesBtn.disabled = true;
  noBtn.disabled = true;
  statusBox.textContent = message;
}

function restoreEditableState() {
  guestName.disabled = false;
  guestCount.disabled = false;
  updateButtons();
}

async function submitRSVP(choice) {
  if (isAlreadySubmitted()) {
    disableFormPermanently();
    return;
  }

  const name = guestName.value.trim();
  const deviceId = getOrCreateDeviceId();
  const parsedCount = Number.parseInt(guestCount.value, 10);
  let peopleCount = 0;

  if (!name) {
    statusBox.textContent = "Please enter your name first.";
    return;
  }

  if (choice === "Attending") {
    if (!Number.isInteger(parsedCount) || parsedCount < 1) {
      statusBox.textContent = "Please enter number of people joining.";
      return;
    }
    peopleCount = parsedCount;
  }

  setBusyState("Submitting RSVP...");

  try {
    const body = new URLSearchParams({
      name: name,
      rsvp: choice,
      deviceId: deviceId,
      peopleCount: String(peopleCount)
    });

    const response = await fetch(SCRIPT_URL, {
      method: "POST",
      body: body
    });

    const result = await response.json();

    if (result.status === "success") {
      setSubmitted();
      statusBox.textContent = "Thank you! Your RSVP has been submitted.";
      disableFormPermanently();
    } else {
      statusBox.textContent = result.message || "Submission failed.";

      if ((result.message || "").toLowerCase().includes("already submitted")) {
        setSubmitted();
        disableFormPermanently();
      } else {
        restoreEditableState();
      }
    }
  } catch (error) {
    statusBox.textContent = "Submission failed. Please try again.";
    restoreEditableState();
  }
}

guestName.addEventListener("input", updateButtons);
guestCount.addEventListener("input", updateButtons);
yesBtn.addEventListener("click", () => submitRSVP("Attending"));
noBtn.addEventListener("click", () => submitRSVP("Not Attending"));

updateButtons();
