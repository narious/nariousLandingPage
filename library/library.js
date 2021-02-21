

// Object constructor better than const
function Book(title, author, pages, readstatus) {
    this.title = title
    this.author = author
    this.pages = pages
    this.readstatus = readstatus
    this.info = function() {
        const status = this.readstatus ? "Has been read" : "Has not been read";
        return (`${this.title} by ${this.author}, ${this.pages}. ${status}`)
    }
}

const book1 = new Book("Silence of the Lambs", "Thomas Harris", 162, true);
var books = [book1];
var num = [1,2,3,4,5]

function addBook() {
    const bookTitle = document.getElementById("bookTitle");
    console.log("hello")
}


function displayBooks() {
    console.log("Hello");
    books.forEach(element => {
        const info = element.info()
        var line = document.createElement("li")
        line.innerText = info
        document.getElementById("bookList").appendChild(line)
    });
}

// Jquery
$(document).ready(function() {
    $("#listTitle").html("Add Books");
});