'use strict';

const cartItem = {
	props: ['cartItem'],
	template: `
	<li class="cart__item cart-item"> 
    	<img class="cart-item__image" :src="cartItem.img" alt="cartItem.altForImg" width="100" height="100">
		<div class="cart-item__inner">
			<h3 class="cart-item__name">{{ cartItem.product_name }}</h3>
			<button class="cart-item__button" type="button" @click="$root.$refs.cart.removeCartProduct(cartItem)">
				<svg class="cart-item__icon" width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
					<path
						d="M11.2453 9L17.5302 2.71516C17.8285 2.41741 17.9962 2.01336 17.9966 1.59191C17.997 1.17045 17.8299 0.76611 17.5322 0.467833C17.2344 0.169555 16.8304 0.00177586 16.4089 0.00140366C15.9875 0.00103146 15.5831 0.168097 15.2848 0.465848L9 6.75069L2.71516 0.465848C2.41688 0.167571 2.01233 0 1.5905 0C1.16868 0 0.764125 0.167571 0.465848 0.465848C0.167571 0.764125 0 1.16868 0 1.5905C0 2.01233 0.167571 2.41688 0.465848 2.71516L6.75069 9L0.465848 15.2848C0.167571 15.5831 0 15.9877 0 16.4095C0 16.8313 0.167571 17.2359 0.465848 17.5342C0.764125 17.8324 1.16868 18 1.5905 18C2.01233 18 2.41688 17.8324 2.71516 17.5342L9 11.2493L15.2848 17.5342C15.5831 17.8324 15.9877 18 16.4095 18C16.8313 18 17.2359 17.8324 17.5342 17.5342C17.8324 17.2359 18 16.8313 18 16.4095C18 15.9877 17.8324 15.5831 17.5342 15.2848L11.2453 9Z" />
				</svg>
			</button>
			<ul class="cart-item__list">
				<li class="cart-item__item">{{ cartItem.price*cartItem.quantity }} рублей</li>
				<li class="cart-item__item item-descr">
					<button class="item-descr__button" type="button" @click="$root.$refs.cart.minusQuantityProduct(cartItem)"><i class="fas fa-minus"></i></button>
					<p class="item-descr__text">{{ cartItem.quantity }}</p>
					<button class="item-descr__button" type="button" @click="$root.$refs.cart.plusQuantityProduct(cartItem)"><i class="fas fa-plus"></i></button>
				</li>
			</ul>
		</div>
	</li>
    `
}

const cart = {
	components: {
		cartItem
	},

	data() {
		return {
			cartUrl: '/getBasket.json',
			cartProducts: [],
			sum: 0,
			count: 0,
			isVisibleCart: false,
			cartIsEmpty: false
		}
	},

	methods: {
		addProduct(product) {
			let find = this.cartProducts.find(el => el.id_product === product.id_product);
			if (find) {
				this.$parent.putJson(`/api/cart/${product.id_product}/${product.product_name}`, {
						quantity: 1
					})
					.then(data => {
						if (data.result) {
							find.quantity++;
							this.sum += find.price;
							this.count++;
						}
					})
			} else {
				let prod = Object.assign({
					quantity: 1
				}, product);
				this.$parent.postJson(`api/cart/${product.id_product}/${product.product_name}`, prod)
					.then(data => {
						if (data.result) {
							this.cartProducts.push(prod);
							this.sum += prod.price;
							this.count++;
							this.checkIsCartEmpty();
						}
					})
			};
		},

		plusQuantityProduct(product) {
			this.$parent.putJson(`/api/cart/${product.id_product}/${product.product_name}`, {
					quantity: 1
				})
				.then(data => {
					if (data.result) {
						product.quantity++;
						this.sum += product.price;
						this.count++;
					}
				})
		},

		removeCartProduct(product) {
			this.$parent.delJson(`/api/cart/${product.id_product}/${product.product_name}`, product)
				.then(data => {
					if (data.result) {
						this.cartProducts.splice(this.cartProducts.indexOf(product), 1);
						this.checkIsCartEmpty();
						this.getSum();
						this.getCount();
					} else {
						console.log('error');
					}
				})
		},

		minusQuantityProduct(product) {
			this.$parent.putJson(`/api/cart/${product.id_product}/${product.product_name}`, {
					quantity: -1
				})
				.then(data => {
					if (data.result === 1) {
						if (product.quantity > 1) {
							product.quantity--;
							this.sum -= product.price;
							this.count--;
						} else {
							this.cartProducts.splice(this.cartProducts.indexOf(product), 1);
							this.checkIsCartEmpty();
							this.getSum();
							this.getCount();
						}
					}
				})
		},

		changeVisiblityOfCart() {
			this.isVisibleCart = !this.isVisibleCart;
		},

		checkIsCartEmpty() {
			if (this.cartProducts.length == 0) {
				this.cartIsEmpty = true;
			} else {
				this.cartIsEmpty = false;
			}
		},

		getSum() {
			let sum = 0;
			this.cartProducts.forEach(product => {
				sum += product.price * product.quantity;
			});
			this.sum = sum;
		},

		getCount() {
			let count = 0;
			this.cartProducts.forEach(product => {
				count += product.quantity;
			});
			this.count = count;
		}
	},

	mounted() {
		this.$parent.getJson(`/api/cart`)
			.then(data => {
				for (let el of data.contents) {
					this.cartProducts.push(el);
				}
				this.getSum();
				this.getCount();
				this.checkIsCartEmpty();
			})
			.catch(error => {
				console.log(error);
				this.$parent.cartDataError = true;
				this.cartIsEmpty = false;
			})
	},

	template: `
	<div v-show="isVisibleCart" class="header-main__cart cart">
		<slot></slot>
		<p v-if="cartIsEmpty" class="cart__warning">Корзина пуста.</p>
		<template v-else>
			<ul class="cart__list">
				<cart-item v-for="product of cartProducts" :key="product.id_product" :cart-item="product"></cart-item>
			</ul>
			<hr class="line">
			<div class="cart__bot-inner">
				<div class="cart__container">
					<p class="cart__text">Товаров в корзине: {{ count }}</p>
					<p class="cart__text cart__text_margin">Итого: {{ sum }} рублей</p>
					<hr class="line">
					<a href=# class="cart__button">Перейти к оформлению</a>
				</div>
			</div>
		</template>
	</div>
    `
};