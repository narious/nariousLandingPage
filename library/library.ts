
// Object constructor better than const
function Book(title: string, author: string, pages: number, readstatus: boolean){
    this.title = title
    this.author = author
    this.pages = pages
    this.readstatus = readstatus
    this.info = function() {
        const status = this.readstatus ? "Has been read" : "Has not been read";
        return (`${this.title} by ${this.author}, ${this.pages}. ${status}`)
    }
}

const book1 = Book("Silence of the Lambs", "Thomas Harris", 162, true);
var books = [book1];

function addBook() {
    const bookTitle = document.getElementById("bookTitle");
    console.log(bookTitle)
}


function displayBooks() {
    console.log("Hello");
    books.forEach(element => {
        const info = element.info()
        var line = document.createElement("ol")
        line.innerText = info
        document.getElementById("bookList").appendChild(line)
    });

}