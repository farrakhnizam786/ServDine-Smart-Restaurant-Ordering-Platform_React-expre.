// 💰 Format price
export const formatPrice = (price) => {
    return `₹${price}`;
};

// 🧮 Calculate total
export const calculateTotal = (cart) => {
    return cart.reduce((sum, item) => {
        return sum + item.price * item.quantity;
    }, 0);
};