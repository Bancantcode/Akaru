import {
    getAuth,
    onAuthStateChanged
} from "firebase/auth";
import {
    doc,
    collection,
    setDoc,
    getDoc,
    getDocs,
    addDoc,
    deleteDoc,
    updateDoc,
    getFirestore
} from "firebase/firestore";
import { auth, db, storage } from "./init.js";
import { ref, uploadBytesResumable, getDownloadURL, listAll } from "firebase/storage";

// Firestore Variables
let idArray = [];
let authorsMap = [];

// DOM Variables
const addBookForm = document.querySelector("#addBookForm");
const updateBookForm = document.querySelector("#updateBookForm");
const removeBookForm = document.querySelector("#removeBookForm");

const addBookBtn = document.querySelector("#addBook");
const updateBookBtn = document.querySelector("#updateBook");
const delBookBtn = document.querySelector("#removeBook");
const bookContainer = document.querySelector("[data-book-container]");
const rowTemplate = document.querySelector("[data-book-row]");

// Start Get Books
const getBooks = async () => {
    const booksCollection = collection(db, "book");
    const getBooks = await getDocs(booksCollection);
    idArray = [];
    bookContainer.innerHTML = "";
    getBooks.forEach(async (doc) => {
        const docData = doc.data();
        idArray.push(parseInt(doc.id));
        await appendToContainer(doc.id, docData.bookName, docData.bookCategory, docData.authors, docData.imagePath);
    });
    return idArray;
}

const appendToContainer = async (productID, productName, productCategory, productAuthors, productImage) => {
    const row = rowTemplate.content.cloneNode(true).children[0];
    const id = row.querySelector("[data-book-id]");
    const name = row.querySelector("[data-book-name]");
    const category = row.querySelector("[data-book-category]");
    const authors = row.querySelector("[data-book-authors]");
    const image = row.querySelector("[data-book-image]");

    let authorsList = Object.values(productAuthors || {});

    id.textContent = productID;
    name.textContent = productName;
    category.innerHTML = productCategory.join("<br>");
    authors.innerHTML = authorsList.join("<br>");

    if (productImage) {
        image.src = productImage;
    } else {
        image.src = "path/to/default/image.png";
    }

    bookContainer.append(row);
}

// Load All books on page load
window.onload = getBooks();

// Check for existing file name in storage
const checkFileExists = async (fileName) => {
    const listRef = ref(storage, 'book_images/');
    const result = await listAll(listRef);
    return result.items.some(item => item.name === fileName);
};

// Adding New Books
const addNewBook = async () => {
    const productNameInput = document.querySelectorAll("[name=prodName]");
    const productCategoryInput = document.querySelectorAll("[name=prodCategory]");
    const productAuthorInput = document.querySelectorAll("[name=prodAuthors]");
    const productImageInput = addBookForm.querySelector("[name=prodImage]");
    const productImage = productImageInput.files[0];
    await getBooks();

    let newId = 1;
    while (idArray.includes(newId)) {
        newId++;
    }

    const prodName = productNameInput[0].value.trim();
    const prodCategory = productCategoryInput[0].value.split(",").map(x => x.trim()).filter(x => x !== "");
    const prodAuthors = productAuthorInput[0].value.split(",").map(x => x.trim()).filter(x => x !== "");

    authorsMap = {};
    for (let i = 0; i < prodAuthors.length; i++) {
        let author = `Author${i + 1}`;
        authorsMap[author] = prodAuthors[i];
    }
        // Katangahan sa javascript
    // Use a better sorting algo, JS way sucks
    // console.log(idArray);
    // idArray.sort((a, b) => a - b);
    // idArray.sort((a, b) => b - a);
    // for (inc = 0; inc < idArray.length; inc++) {
    //     console.log(inc)
    //     if (idArray.includes(inc.toString())) {
    //         console.log(true)
    //     }
    // }
    // while (idArray.includes(inc.toString())) {
    //     inc++;
    // }

    // FireStorage: ADD IMAGE SUPPORT HERE
    try {
        let imagePath = "";
        if (productImage) {
            const fileExists = await checkFileExists(productImage.name);

            if (fileExists) {
                alert("This file name is already taken and uploaded, try another.");
                return; 
            }

            const imageRef = ref(storage, `book_images/${productImage.name}`);
            const uploadTask = uploadBytesResumable(imageRef, productImage);
            await new Promise((resolve, reject) => {
                uploadTask.on(
                    'state_changed',
                    null,
                    (error) => {
                        console.error("Image upload failed:", error);
                        reject(error);
                    },
                    async () => {
                        imagePath = await getDownloadURL(uploadTask.snapshot.ref);
                        console.log("Image uploaded successfully:", imagePath);
                        resolve();
                    }
                );
            });
        }

        await setDoc(doc(db, "book", newId.toString()), {
            bookName: prodName,
            bookCategory: prodCategory,
            authors: authorsMap,
            imagePath: imagePath
        });

        await getBooks();
        addBookForm.reset();
    } catch (error) {
        console.error("Error adding book:", error.message);
    }
};

addBookBtn.addEventListener("click", addNewBook);

// Updating Books
const updateBook = async () => {
    const productIdInput = updateBookForm.querySelector("[name=prodId]");
    const productNameInput = updateBookForm.querySelector("[name=prodName]");
    const productCategoryInput = updateBookForm.querySelector("[name=prodCategory]");
    const productAuthorInput = updateBookForm.querySelector("[name=prodAuthors]");
    const prodImageInput = updateBookForm.querySelector("[name=prodImage]");
    const prodImage = prodImageInput.files[0];

    const prodId = productIdInput.value.trim();
    const prodName = productNameInput.value.trim();
    const prodCategory = productCategoryInput.value.split(",").map(x => x.trim()).filter(x => x !== "");
    const prodAuthors = productAuthorInput.value.split(",").map(x => x.trim()).filter(x => x !== "");

    const updateData = {};

    if (prodName !== "") {
        updateData.bookName = prodName;
    }

    if (prodCategory.length > 0) {
        updateData.bookCategory = prodCategory;
    }

    if (prodAuthors.length > 0) {
        const updatedAuthorsMap = {};
        prodAuthors.forEach((author, index) => {
            updatedAuthorsMap[`Author${index + 1}`] = author;
        });
        updateData.authors = updatedAuthorsMap;
    }

    try {
        if (prodImage) {
            const fileExists = await checkFileExists(prodImage.name);

            if (fileExists) {
                alert("This file name is already taken and uploaded, try another.");
            }

            const imageRef = ref(storage, `book_images/${prodImage.name}`);
            const uploadTask = uploadBytesResumable(imageRef, prodImage);

            await new Promise((resolve, reject) => {
                uploadTask.on(
                    'state_changed',
                    null,
                    (error) => {
                        console.error("Image upload failed:", error);
                        reject(error);
                    },
                    async () => {
                        const imagePath = await getDownloadURL(uploadTask.snapshot.ref);
                        updateData.imagePath = imagePath;
                        console.log("Image uploaded successfully:", imagePath);
                        resolve();
                    }
                );
            });
        }

        if (Object.keys(updateData).length > 0) {
            await updateDoc(doc(db, "book", prodId), updateData);
        } else {
            console.log("No updates provided.");
        }

        await getBooks();
        updateBookForm.reset();
    } catch (error) {
        console.error("Error updating book:", error.message);
    }
};

updateBookBtn.addEventListener("click", updateBook);

// Deleting Books
const deleteBook = async () => {
    const productId = document.querySelectorAll("[name=prodId]");
    const prodId = productId[1].value.trim();
    idArray = [];

    try {
        await deleteDoc(doc(db, "book", prodId));
        await getBooks();
        removeBookForm.reset();
    } catch (error) {
        console.error(error.message);
    }
};

delBookBtn.addEventListener("click", deleteBook);
