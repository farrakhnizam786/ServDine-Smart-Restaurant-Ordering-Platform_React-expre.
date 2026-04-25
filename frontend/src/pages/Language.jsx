import { Globe, Check } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "react-toastify";

function Language() {
    const [selected, setSelected] = useState("en");

    const languages = [
        { code: "en", name: "English", native: "English" },
        { code: "hi", name: "Hindi", native: "हिन्दी" },
        { code: "es", name: "Spanish", native: "Español" },
        { code: "fr", name: "French", native: "Français" },
        { code: "ar", name: "Arabic", native: "العربية" }
    ];

    const handleSelect = (code) => {
        setSelected(code);
        toast.success("Language preference updated");
    };

    return (
        <div className="min-h-screen p-6 max-w-2xl mx-auto pt-24">
            <div className="flex items-center gap-3 mb-8">
                <Globe className="w-8 h-8 text-brand-primary" />
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Language Settings</h1>
                    <p className="text-gray-500 mt-1">Choose your preferred language</p>
                </div>
            </div>

            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-panel overflow-hidden"
            >
                <div className="divide-y divide-white/5">
                    {languages.map((lang) => (
                        <button
                            key={lang.code}
                            onClick={() => handleSelect(lang.code)}
                            className={`w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors ${selected === lang.code ? 'bg-brand-primary/5' : ''}`}
                        >
                            <div className="text-left">
                                <p className="font-bold text-gray-900 text-lg">{lang.native}</p>
                                <p className="text-sm text-gray-500">{lang.name}</p>
                            </div>
                            <div className={`w-6 h-6 rounded-full border flex items-center justify-center ${selected === lang.code ? 'border-brand-primary bg-brand-primary' : 'border-gray-500'}`}>
                                {selected === lang.code && <Check className="w-4 h-4 text-gray-900" />}
                            </div>
                        </button>
                    ))}
                </div>
            </motion.div>
        </div>
    );
}

export default Language;
