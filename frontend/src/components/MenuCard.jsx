import { formatPrice } from "../utils/helpers";

function MenuCard({ item, addToCart }) {
    return (
        <div style={styles.card}>
            <h3>{item.name}</h3>
            <p>{formatPrice(item.price)}</p>
            <p>{item.category}</p>

            <button onClick={() => addToCart(item)}>
                Add to Cart
            </button>
        </div>
    );
}

const styles = {
    card: {
        border: "1px solid #ccc",
        padding: "10px",
        borderRadius: "10px",
    },
};

export default MenuCard;