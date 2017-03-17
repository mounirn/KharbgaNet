
// this here refers to when the object is defined and not when used -- this refers to the parent object
let deck = {
    suits: ["hearts", "spades", "clubs", "diamonds"],
    cards: Array(52),
    createCardPicker: function () {
        // NOTE: the line below is now an arrow function, allowing us to capture 'this' right here
        return () => {
            let pickedCard = Math.floor(Math.random() * 52);
            let pickedSuit = Math.floor(pickedCard / 13);

            return { suit: this.suits[pickedSuit], card: pickedCard % 13 };
        }
    }
}

let cardPicker = deck.createCardPicker();
let pickedCard = cardPicker();

alert("card: " + pickedCard.card + " of " + pickedCard.suit);


// this here refers to where the object is used -- which is window or the sript
let deck2 = {
    suits: ["hearts", "spades", "clubs", "diamonds"],
    cards: Array(52),
    createCardPicker: function () {
        return function () {
            let pickedCard3 = Math.floor(Math.random() * 52);
            let pickedSuit3 = Math.floor(pickedCard3 / 13);

            return { suit: this.suits[pickedSuit3], card: pickedCard3 % 13 };
        }
    }
}

let cardPicker2 = deck2.createCardPicker();
let pickedCard2 = cardPicker2();

alert("card2: " + pickedCard2.card + " of " + pickedCard2.suit);