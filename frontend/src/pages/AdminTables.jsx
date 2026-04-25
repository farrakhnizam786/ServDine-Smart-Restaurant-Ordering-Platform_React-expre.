import { useState, useEffect } from "react";
import API from "../api/axios";
import { toast } from "react-toastify";
import { Table, QrCode, Plus, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import QRCode from "qrcode";

function AdminTables() {
    const [tables, setTables] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const [tableNumber, setTableNumber] = useState("");
    const [name, setName] = useState("");
    const [qrs, setQrs] = useState({});

    useEffect(() => {
        const fetchTables = async () => {
            try {
                const res = await API.get("/tables");
                setTables(res.data.tables || res.data);
            } catch (err) {
                console.error(err);
                // Demo tables
                setTables([
                    { _id: '1', tableNumber: '1', name: 'Window 1' },
                    { _id: '2', tableNumber: '2', name: 'Booth A' }
                ]);
            } finally {
                setLoading(false);
            }
        };
        fetchTables();
    }, []);

    const generateQR = async (table) => {
        try {
            const user = JSON.parse(localStorage.getItem("user"));
            const url = `${window.location.origin}/menu/${user.restaurantId}?table=${table.tableNumber}`;
            const qrCodeDataUrl = await QRCode.toDataURL(url);
            setQrs(prev => ({ ...prev, [table._id]: qrCodeDataUrl }));
        } catch (err) {
            toast.error("Failed to generate QR");
        }
    };

    const addTable = async (e) => {
        e.preventDefault();
        try {
            const res = await API.post("/tables", { tableNumber, name });
            toast.success("Table added successfully");
            setTables([...tables, res.data.table || res.data]);
            setTableNumber(""); setName("");
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to add table");
        }
    };

    const deleteTable = async (id) => {
        try {
            await API.delete(`/tables/${id}`);
            setTables(tables.filter(t => t._id !== id));
            toast.info("Table deleted");
        } catch (err) {
            toast.error("Failed to delete table");
        }
    };

    if (loading) return <div className="min-h-screen flex justify-center items-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div></div>;

    const user = JSON.parse(localStorage.getItem("user") || "{}");

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8">
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
                <Table className="w-8 h-8 text-brand-primary" /> 
                Table Management & QR Codes {user.restaurantName ? `- ${user.restaurantName}` : ''}
            </h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form */}
                <motion.div className="glass-panel p-6 lg:col-span-1 h-fit sticky top-24">
                    <h2 className="text-xl font-bold text-gray-900 mb-6">Add New Table</h2>
                    <form onSubmit={addTable} className="space-y-4">
                        <div>
                            <label className="block text-sm text-gray-500 mb-1">Table Number</label>
                            <input required className="input-field" value={tableNumber} onChange={(e) => setTableNumber(e.target.value)} placeholder="e.g. 5" />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-500 mb-1">Table Name/Location</label>
                            <input required className="input-field" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. VIP Booth" />
                        </div>
                        <button type="submit" className="glass-button w-full"><Plus className="w-4 h-4"/> Add Table</button>
                    </form>
                </motion.div>

                {/* List */}
                <div className="lg:col-span-2">
                    <div className="glass-panel p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-6">Active Tables ({tables.length})</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {tables.map(table => (
                                <div key={table._id} className="flex flex-col bg-gray-50 border border-gray-100 p-5 rounded-xl">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h4 className="font-bold text-gray-900 text-lg">Table {table.tableNumber}</h4>
                                            <p className="text-gray-500 text-sm">{table.name}</p>
                                        </div>
                                        <button onClick={() => deleteTable(table._id)} className="text-gray-500 hover:text-red-500 transition-colors">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                    
                                    {qrs[table._id] ? (
                                        <div className="mt-2 text-center bg-white p-2 rounded-lg inline-block self-center">
                                            <img src={qrs[table._id]} alt={`QR for Table ${table.tableNumber}`} className="w-32 h-32" />
                                        </div>
                                    ) : (
                                        <button 
                                            onClick={() => generateQR(table)}
                                            className="mt-auto flex items-center justify-center gap-2 bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary py-2 rounded-lg text-sm font-bold transition-colors"
                                        >
                                            <QrCode className="w-4 h-4" /> Generate QR Code
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AdminTables;
