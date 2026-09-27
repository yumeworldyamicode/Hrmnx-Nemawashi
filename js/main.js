const accountStatus =
    document.getElementById("account-status");

const signInButton =
    document.getElementById("sign-in-button");

const heroLoginButton =
    document.getElementById("hero-login-button");

const finalLoginButton =
    document.getElementById("final-login-button");



async function checkNemawashiSession() {

    const {
        data: {
            user
        },
        error
    } = await supabaseClient.auth.getUser();


    if (error) {

        console.error(
            "Could not check account:",
            error
        );

        accountStatus.textContent =
            "Not signed in";

        return;

    }


    if (!user) {

        accountStatus.textContent =
            "Not signed in";

        return;

    }


    accountStatus.textContent =
        user.email || "Signed in";

    signInButton.textContent =
        "Open Nemawashi";

}


function openNemawashi() {

    window.location.href =
        "dashboard.html";

}


signInButton.addEventListener(
    "click",
    openNemawashi
);


heroLoginButton.addEventListener(
    "click",
    openNemawashi
);


finalLoginButton.addEventListener(
    "click",
    openNemawashi
);


supabaseClient.auth.onAuthStateChange(
    function () {

        checkNemawashiSession();

    }
);


checkNemawashiSession();
