import {
    getAuth,
    createUserWithEmailAndPassword,
    updateProfile,
    deleteUser,
} from "firebase/auth";
import {
    doc,
    collection,
    setDoc,
    getDoc,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    getFirestore
} from "firebase/firestore";
import { app } from "./init.js";

//variables na ginamit for the id
const auth = getAuth(app);
const db = getFirestore(app);
let userIDs = [];  // Storing the id or like array to

//mga buttons from the html
const addUserForm = document.querySelector("#addUserForm");
const updateUserForm = document.querySelector("#updateUserForm");
const removeUserForm = document.querySelector("#removeUserForm");

const addUserBtn = document.querySelector("#addUser");
const updateUserBtn = document.querySelector("#updateUser");
const delUserBtn = document.querySelector("#removeUser");
const userContainer = document.querySelector("[data-user-container]");
const rowTemplate = document.querySelector("[data-user-row]");

//get the users
const getUsers = async () => {
    const usersCollection = collection(db, "users"); //This part sets the users varriable in the database
    const getUsers = await getDocs(usersCollection);

    userIDs = [];
    userContainer.innerHTML = "";
    getUsers.forEach(async (doc) => {
        const docData = doc.data();
        userIDs.push(parseInt(doc.id));
        await appendUserToContainer(doc.id, docData.userName, docData.email, docData.userRole); //console log values
        // console.log("Doc.id= ", doc.id, "Username= ", docData.userName);
        // console.log("DocData: ", docData);
    });
    return userIDs;
};

const appendUserToContainer = async (usersID, userName, userEmail, userRole) => {
    const row = rowTemplate.content.cloneNode(true).children[0];
    const id = row.querySelector("[data-user-id]");
    const name = row.querySelector("[data-user-username]");
    const email = row.querySelector("[data-user-email]");
    const role = row.querySelector("[data-user-role]");

    id.textContent = usersID;
    name.textContent = userName;
    email.textContent = userEmail;
    role.textContent = userRole;
    userContainer.append(row);
};

//load all users on window load
window.addEventListener("load", getUsers);

//toggle add user form
//add new user
const addNewUser = async () => {
    const userNameInput = addUserForm.querySelector("[name=username]");
    const userEmailInput = addUserForm.querySelector("[name=email]");
    const userRoleInput = addUserForm.querySelector("[name=role]");
    await getUsers();

    const userName = userNameInput.value.trim();
    const userEmail = userEmailInput.value.trim();
    const userRole = userRoleInput.value.trim();
    const userPass = "test123"; //default pass ginamit namen since nag eeror sya if walang defaultPassword and userPass sa line nato 
    const objToSend = { displayName: userName, email: userEmail, password: userPass };
    let userID;

    try {
        //create user in Firebase Authentication
        // METHOD TO ADD USER IN AUTHENTICATION WITH API
        await fetch("/api/users/create", {
            method: "POST",
            headers: { "Content-Type": "application/json", },
            body: JSON.stringify(objToSend),
        })
            .then(res => res.json())
            .then(data => {
                userID = data.user
            })
            .catch(err => console.error(err))

        await setDoc(doc(db, "users", userID), {
            userName: userName,
            email: userEmail,
            userRole: userRole,
            userPass: userPass
        });

        // console.log("User added successfully with the ID:", user.uid); // notify website kung nakapag add ng uid 
        await getUsers();
        addUserForm.reset();
    } catch (error) {
        console.error("Error adding the user: ", error.message);
    }
};
addUserBtn.addEventListener("click", addNewUser);
// end add new user


//toggle update user form
//update user
const updateUser = async () => {
    const userIdInput = updateUserForm.querySelector("[name=userId]");
    const userNameInput = updateUserForm.querySelector("[name=username]");
    const userEmailInput = updateUserForm.querySelector("[name=email]");
    const userRoleInput = updateUserForm.querySelector("[name=role]");

    const userID = userIdInput.value.trim();
    const userName = userNameInput.value.trim();
    const email = userEmailInput.value.trim();
    const userRole = userRoleInput.value.trim();
    const updateData = {};

    if (userName !== "") {
        updateData.userName = userName;
    }

    if (email !== "") {
        updateData.email = email;
    }

    if (userRole !== "") {
        updateData.userRole = userRole;
    }


    try {
        await fetch(`api/users/change`, {
            method: "PUT",
            headers: { "Content-Type": "application/json", },
            body: JSON.stringify({
                uid: userID,
                displayName: userName,
                email: email
                // add password
                // password:

            })
        })
            .then(res => res.json())
            .then(data => console.log(data))
            .catch(err => console.error(err))

        if (Object.keys(updateData).length > 0) {
            await updateDoc(doc(db, "users", userID), updateData);
            // console.log("User updated successfully with the ID:", userID);
        } else {
            console.error("No fields to update.");
        }
        await getUsers();
        updateUserForm.reset();
    } catch (error) {
        console.error("Error updating the user: ", error.message);
    }
};

updateUserBtn.addEventListener("click", updateUser);

//toggle remove user form
//remove user
const removeUser = async () => {
    const userIdInput = removeUserForm.querySelector("[name=userId]");
    const userID = userIdInput.value.trim();

    try {
        await fetch(`api/users/${userID}`);
        await deleteDoc(doc(db, "users", userID));
        await getUsers();
        removeUserForm.reset();
    } catch (error) {
        console.error("Error removing the user: ", error.message);
    }
};

delUserBtn.addEventListener("click", removeUser);

// // Authentication State Listener
// onAuthStateChanged(auth, (user) => {
//     if (user) {
//         console.log("User is authenticated");
//     } else {
//         window.location.href = "../entry_page.html";
//     }
// });
