// this here refers to when the object is defined and not when used -- this refers to the parent object
var deck = {
    suits: ["hearts", "spades", "clubs", "diamonds"],
    cards: Array(52),
    createCardPicker: function () {
        var _this = this;
        // NOTE: the line below is now an arrow function, allowing us to capture 'this' right here
        return function () {
            var pickedCard = Math.floor(Math.random() * 52);
            var pickedSuit = Math.floor(pickedCard / 13);
            return { suit: _this.suits[pickedSuit], card: pickedCard % 13 };
        };
    }
};
var cardPicker = deck.createCardPicker();
var pickedCard = cardPicker();
alert("card: " + pickedCard.card + " of " + pickedCard.suit);
// this here refers to where the object is used
var deck2 = {
    suits: ["hearts", "spades", "clubs", "diamonds"],
    cards: Array(52),
    createCardPicker: function () {
        return function () {
            var pickedCard3 = Math.floor(Math.random() * 52);
            var pickedSuit3 = Math.floor(pickedCard3 / 13);
            return { suit: this.suits[pickedSuit3], card: pickedCard3 % 13 };
        };
    }
};
var cardPicker2 = deck2.createCardPicker();
var pickedCard2 = cardPicker2();
alert("card2: " + pickedCard2.card + " of " + pickedCard2.suit);
