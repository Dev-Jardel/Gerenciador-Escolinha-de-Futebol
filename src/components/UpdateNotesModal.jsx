import React from 'react';
import { Sparkles, Check, X } from 'lucide-react';

const UpdateNotesModal = ({ notes, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg max-h-[90vh] flex flex-col">
                <div className="flex justify-center items-center mb-4 text-center">
                    <Sparkles size={28} className="text-yellow-500 mr-3" />
                    <h3 className="text-2xl font-bold text-gray-800">{notes.title}</h3>
                </div>
                <p className="text-center text-gray-500 mb-6 font-semibold">Versão {notes.version}</p>
                <div className="overflow-y-auto flex-grow pr-2">
                    <ul className="space-y-3">
                        {notes.notes.map((note, index) => (
                            <li key={index} className="flex items-start">
                                <Check size={20} className="text-green-500 mr-3 mt-1 flex-shrink-0" />
                                <span className="text-gray-700">{note}</span>
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="flex justify-end pt-6 mt-4 border-t">
                    <button onClick={onClose} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-bold">Entendi!</button>
                </div>
            </div>
        </div>
    );
};


export default UpdateNotesModal;

