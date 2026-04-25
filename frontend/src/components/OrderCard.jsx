function OrderCard({ order, updateStatus }) {
    return (
        <div style={styles.card}>
            <p><strong>Table:</strong> {order.tableNumber}</p>
            <p><strong>Status:</strong> {order.status}</p>

            <div>
                <button onClick={() => updateStatus(order._id, "preparing")}>
                    Preparing
                </button>

                <button onClick={() => updateStatus(order._id, "ready")}>
                    Ready
                </button>

                <button onClick={() => updateStatus(order._id, "delivered")}>
                    Delivered
                </button>
            </div>
        </div>
    );
}

const styles = {
    card: {
        border: "1px solid #ccc",
        padding: "10px",
        marginBottom: "10px",
        borderRadius: "10px",
    },
};

export default OrderCard;