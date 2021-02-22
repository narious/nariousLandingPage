

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
    if  (!validateBookInput()) {
        // Do something
        return
    } 

    // We assume the input is consistant and due to validation step
    const hasread = document.getElementById("readStatusYes").checked ? true : false
    $('[name=bookTitle]').val()
    const newbook = new Book($('[name=bookTitle]').val(), $('[name=author]').val(), $('[name=pages]').val(), hasread)

    // Checks for duplicates
    for (let index = 0; index < books.length; index++) {
        if (books[index].title == newbook.title && books[index].author == newbook.author) {
            return
        }
    }
    books.push(newbook)
}

function validateBookInput() {
    return true
}

function displayBooks() {

    // Refreshes the list by deleting the old one and creating a new one
    const oldlist = document.getElementById("bookList")
    var newlist = document.createElement('ol')
    newlist.id = 'bookList'
    oldlist.parentNode.insertBefore(newlist, oldlist)
    newlist.nextSibling.remove()

    books.forEach(element => {
        const info = element.info()
        var line = document.createElement("li")
        line.innerText = info
        document.getElementById("bookList").appendChild(line)
    });
}

function closePopup() {
    $("#popup").addClass("transparent")

}
// Jquery
$(document).ready(function() {
    $("#listTitle").html("Add Books");
});