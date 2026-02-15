import { useState, useEffect, useRef } from "react";

export default function Modal({ open, title, onClose, onSubmit, fields }) {
    const [values, setValues] = useState({});
    const firstRef = useRef(null);

    useEffect(() => {
        if (open) {
            setValues({});
            setTimeout(() => firstRef.current?.focus(), 100);
        }
    }, [open]);

    if (!open) return null;

    function handleSubmit(e) {
        e.preventDefault();
        onSubmit(values);
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3 className="modal-title">{title}</h3>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        {fields.map((f, i) => (
                            <div key={f.name} className="input-group">
                                <label>{f.label}</label>
                                <input
                                    ref={i === 0 ? firstRef : null}
                                    type={f.type || "text"}
                                    placeholder={f.placeholder || ""}
                                    value={values[f.name] || ""}
                                    onChange={(e) => setValues({ ...values, [f.name]: e.target.value })}
                                    required={f.required !== false}
                                    minLength={f.minLength}
                                    autoComplete="off"
                                />
                                {f.hint && <span className="modal-hint">{f.hint}</span>}
                            </div>
                        ))}
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn-ghost" onClick={onClose}>ยกเลิก</button>
                        <button type="submit" className="btn-primary">ยืนยัน</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
