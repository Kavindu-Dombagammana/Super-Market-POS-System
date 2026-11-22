const adminUsername = "admin";
const adminPassword = "admin";

const users =[
    {
        "username" : "user01",
        "password" : "1234"
    },
    {
        "username" : "user02",
        "password" : "1234"
    },
    {
        "username" : "user03",
        "password" : "1234"
    },
]
function checkLoginDetailsOnAction() {
    const username = document.getElementById("txtUsername").value;
    const password = document.getElementById("txtPassword").value;

    //use this to display an error
    const errorText = document.getElementById("error-display");

    if (username === null && password === null) {
        errorText.textContent = "*Username Or Password cannot be empty";
    }
    //check if its admin
    if (username === adminUsername && password === adminPassword) {
        window.open('admin.html');

    }
    if (checkUser(username,password)) {
        window.open('user.html');
    }else{
        errorText.textContent = "*Username Or Password Is Incorrect";
    }
}

function checkUser(username,password) {
    let userExist = false; 
    users.forEach(element => {
        if (element.username === username && element.password === password) {
            userExist = true;
            return userExist;
        }
    });
    return userExist;
}