var names = " ";
var prices = 0;

function paymentValues( title, price) {
    localStorage.setItem("bookingTitle", title);
    localStorage.setItem("bookingPrice", price);
}


function changingValues() {
    var title = localStorage.getItem("bookingTitle");
    var price = localStorage.getItem("bookingPrice");

    document.getElementById("cartProduct").innerHTML = title;
    document.getElementById("cartPrice").innerHTML = price + " AED";
    document.getElementById("amountPrice").innerHTML = price + " AED";
    document.getElementById("total").innerHTML = parseInt(price) + parseInt(emiratesObj.emiratesList[0].DeliveryPrice);
}

