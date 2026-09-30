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

        signInButton.textContent =
            "Sign in";

        return false;

    }


    if (!user) {

        accountStatus.textContent =
            "Not signed in";

        signInButton.textContent =
            "Sign in";

        return false;

    }


    accountStatus.textContent =
        user.email || "Signed in";

    signInButton.textContent =
        "Open Nemawashi";

    return true;

}



async function openNemawashi() {

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

        window.location.href =
            "login.html";

        return;

    }


    if (!user) {

        window.location.href =
            "login.html";

        return;

    }


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
