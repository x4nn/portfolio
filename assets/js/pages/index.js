/* ============================================
   Index Page Scripts
   ============================================ */

// Import shared functionality (will be loaded from global.js)
// This file contains page-specific logic for index.html

document.addEventListener('DOMContentLoaded', () => {
    // Any index-page specific initialization here
    console.log('Index page loaded');
});

const birthdate = new Date('2005-05-01'); // Replace with actual birthdate

function initAge() {
    const $ageField = document.querySelector('#age');

    const age = calculateAge(birthdate);
    $ageField.textContent = age;
}

function calculateAge(birthdate) {
    const today = new Date();
    let age = today.getFullYear() - birthdate.getFullYear();
    const monthDiff = today.getMonth() - birthdate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthdate.getDate())) {
        age--;
    }
    return age;
}

initAge();