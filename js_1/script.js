'use strict';

const API = 'https://raw.githubusercontent.com/GeekBrainsTutorial/online-store-api/master/responses';

//Базовый класс для всех списков (для каталога и корзины)
class List {
    constructor(url, container, list = list2){
        this.container = container; // this - ссылка на объект который запустил конструктор
        this.list = list;
        this.url = url;
        this.goods = [];
        this.allProducts = [];
        this.filtered = [];
        this._init(); //
    }

    async getJson(url) {
        try {
            const result = await fetch(url ? url : `${API + this.url}`);
            return await result.json();
        } catch (error) {
            console.log(error);
        }
    }

    handleData(data) {
        this.goods = [...data];
        this.render();
    }

    calcSum() {
        return this.allProducts.reduce((accum, item) => accum += item.price, 0);
    }

    render() {
        const block = document.querySelector(this.container);
        for (let product of this.goods) {
            const productObj = new this.list[this.constructor.name](product);
            this.allProducts.push(productObj);
            block.insertAdjacentHTML('beforeend',productObj.render());
        }
    }

    filter(value) {
        const regExp = new RegExp(value, 'i');
        this.filtered = this.allProducts.filter(product => regExp.test(product.product_name));
        console.log(this.filtered);
        this.allProducts.forEach(el => {
            const good = document.querySelector(`.product-item[data-id="${el.id_product}"]`);
            if (!this.filtered.includes(el)) {
                good.classList.remove('product');
                good.classList.add('invisible');
            } else {
                good.classList.remove('invisible');
            }
        });
    }

    _init() { // _ - рекомендовано запускать метод только из текущего класса
        return false;
    }
}

// Базовый класс для товара каталога и товара корзины
class Item {
    constructor(el, img = 'https://placehold.it/200x150') {
        this.product_name = el.product_name;
        this.price = el.price;
        this.id_product = el.id_product;
        this.img = img;
    }

    render() {
        return (
            `<div class="product-item product" data-id="${this.id_product}">
                <img src="${this.img}" alt="product">
                <div class="desc">
                    <h3>${this.product_name}</h3>
                    <p>${this.price}</p>
                    <button class="buy-btn"
                        data-id="${this.id_product}"
                        data-name="${this.product_name}"
                        data-price="${this.price}"
                    >
                        Купить
                    </button>
                </div>
            </div>`
        );
    }
}

//Список товаров каталога наследуется от базового списка
class ProductsList extends List {
    constructor(cart, container = '.products', url = "/catalogData.json") {
        super(url, container); //вызов базового конструктора List
        this.cart = cart;
        this.getJson()
            .then(data => this.handleData(data));
    }

    _init() {
        document.querySelector(this.container).addEventListener('click', e => {
            if (e.target.classList.contains('buy-btn')) {
                this.cart.addProduct(e.target);
            }
        });
        document.querySelector('.search-form').addEventListener('submit', e => { // submit - для отправки по enter
            e.preventDefault(); // отмена перегрузки страницы или перехода на другую страницу
            this.filter(document.querySelector('.search-field').value);
        });
    }
}

//Товар каталога наследуется от базового класса товара
class ProductItem extends Item{} //{}-на данный момент товар каталога полностью включает в себя базовый класс товара, но его можно дополнить

//Список товаров корзины наследуется от базового списка
class Cart extends List {
    constructor(container = '.cart-block', url = "/getBasket.json") {
        super(url, container); //вызов базового конструктора List
        this.getJson()
            .then(data => {
                this.handleData(data.contents);
            });
    }
       
    addProduct(element) {
        this.getJson(`${API}/addToBasket.json`)
            .then(data => {
                if (data.result === 1) {
                    let productId = +element.dataset['id'];
                    let find = this.allProducts.find(product => product.id_product === productId);
                    if (find) {
                        find.quantity++;
                        this._updateCart(find);
                    } else {
                        let product = {
                            id_product: productId,
                            price: +element.dataset['price'],
                            product_name: element.dataset['name'],
                            quantity: 1,
                        };
                        this.goods = [product];
                        this.render();
                    }
                } else {
                    alert('Error');
                }
            })
    } 

    removeProduct(element) {
        this.getJson(`${API}/deleteFromBasket.json`)
            .then(data => {
                if ( data.result === 1) {
                    let productId = +element.dataset['id'];
                    let find = this.allProducts.find(product => product.id_product === productId);
                    if (find.quantity > 1) {
                        find.quantity--;
                        this._updateCart(find);
                    } else {
                        this.allProducts.splice(this.allProducts.indexOf(find), 1);
                        document.querySelector(`.cart-item[data-id="${productId}"]`).remove();
                    }
                } else {
                    alert('Error');
                }
            })
    }
    
    _updateCart(product) {
        let block = document.querySelector(`.cart-item[data-id="${product.id_product}"]`);
        block.querySelector('.product-quantity').textContent = `Quantity: ${product.quantity}`;
        block.querySelector('.product-price').textContent = `$${product.quantity*product.price}`;
    }
    

    _init() {
        document.querySelector(".btn-cart").addEventListener('click', () => {
            document.querySelector(this.container).classList.toggle('invisible');
        });
        document.querySelector(this.container).addEventListener('click', e => {
            if(e.target.classList.contains('del-btn')){
                this.removeProduct(e.target);
            }
         })
    }
}

//Товар корзины наследуется от базового класса товара
class CartItem extends Item {
    constructor(el, img = 'https://placehold.it/50x100'){
        super(el, img);
        this.quantity = el.quantity;
    }
  
    render() {
        return `<div class="cart-item" data-id="${this.id_product}">
                    <div class="product-bio">
                        <img src="${this.img}" alt="product">
                        <div class="product-desc">
                            <p class="product-title">${this.product_name}</p>
                            <p class="product-quantity">Quantity: ${this.quantity}</p>
                            <p class="product-single-price">$${this.price} each</p>
                        </div>
                    </div>
                    <div class="right-block">
                        <p class="product-price">$${this.quantity * this.price}</p>
                        <button class="del-btn" data-id="${this.id_product}">&times;</button>
                    </div>
                </div>`
    }
}

//нужен для вывода одним метедом render и товаров каталога и корзины (базовый класс List)
const list2 = {
    ProductsList: ProductItem, //св-во Список товаров каталога : значение Товар каталога
    Cart: CartItem, //св-во Список товаров корзины : значение Товар корзины
};

// class A {
//     f(obj) {
//         obj.g();
//     }
// }
// class B {
//     g() {
//     }
// }
// let a = new A();
// let b = new B();
// a.f(b);
let cart = new Cart();
let products = new ProductsList(cart); // для вызова в Каталоге метода Корзины(метод добавление товара в корзину)

