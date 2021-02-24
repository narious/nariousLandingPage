

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


varbookStyles = ["monospace"]
varbookColors = ["gainsboro", "skyblue", "snow", "tomato"]

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
    updateBooks()
    calcTotalBook()
}

function validateBookInput() {
    return true
}

function updateBooks() {

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
        createBookElement(element)
    });

}

function closePopup() {
    $("#popup").addClass("transparent")
}

function openAddBook() {
    $("#popup").removeClass("transparent");
}

function createBookElement(book) {
    var bookdiv = $("<div></div>").addClass("book")
    var bookleft = $("<div></div>").addClass("column left")
    var bookright = $("<div></div>").addClass("column right")
    var title = $("<p></p>").text(`${book.title}`).addClass("bookDetails bkTitleDisplay")
    var author = $("<p></p>").text(` by ${book.author}`).addClass("bookDetails bkAuthDisplay")
    var pages = $("<p></p>").text(`pages: ${book.pages}`).addClass("bookDetails bkPageDisplay")
    var label = $("<label></label>").text("read?").addClass("bookHasRead")
    var input = $("<input></input>").addClass("bookHasRead")
    $(input).attr("type", "checkbox");

    const s = Math.floor(Math.random() * varbookColors.length)
    bookcolor = varbookColors[s]

    bookdiv.attr("style", `background-color:${bookcolor}`)

    bookleft.append(title).append(author).append(pages)
    bookright.append(label).append(input)
    bookdiv.append(bookleft).append(bookright)
    $("#bookdisplay").append(bookdiv)

}


function calcTotalBook() {
    $("#totalBooksCounter").text(books.length)
}
// Jquery
$(document).ready(function() {
    $("#listTitle").html("Add Books");
});


// Function that run on load
calcTotalBook()