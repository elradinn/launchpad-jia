"use client";

interface CustomInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    hasError?: boolean;
    errorMessage?: string;
    type?: "text" | "number";
    min?: number;
    style?: React.CSSProperties;
    prefix?: string;
    suffix?: string;
}

export default function CustomInput({
    value,
    onChange,
    placeholder = "",
    hasError = false,
    errorMessage = "",
    type = "text",
    min,
    style = {},
    prefix,
    suffix
}: CustomInputProps) {
    return (
        <div style={{ width: "100%" }}>
            <div style={{ position: "relative", width: "100%" }}>
                {prefix && (
                    <span style={{
                        position: "absolute",
                        left: "12px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "#6c757d",
                        fontSize: "16px",
                        pointerEvents: "none",
                        zIndex: 1
                    }}>
                        {prefix}
                    </span>
                )}
                <input
                    type={type}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    min={min}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "10px",
                        background: "#fff",
                        border: `1px solid ${hasError ? "#DC2626" : "#ddd"}`,
                        padding: "10px 20px",
                        paddingLeft: prefix ? "28px" : "20px",
                        paddingRight: suffix ? "50px" : "20px",
                        borderRadius: "8px",
                        transition: "0.3s",
                        cursor: "text",
                        width: "100%",
                        fontSize: "14px",
                        color: "#181D27",
                        outline: "none",
                        ...style
                    }}
                    onFocus={(e) => {
                        if (!hasError) {
                            e.target.style.background = "#f8f9fa";
                            e.target.style.borderColor = "#ddd";
                        }
                    }}
                    onBlur={(e) => {
                        e.target.style.background = "#fff";
                        if (!hasError) {
                            e.target.style.borderColor = "#ddd";
                        }
                    }}
                />
                {suffix && (
                    <span style={{
                        position: "absolute",
                        right: "12px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "#6c757d",
                        fontSize: "14px",
                        pointerEvents: "none",
                        zIndex: 1
                    }}>
                        {suffix}
                    </span>
                )}
            </div>
            {hasError && errorMessage && (
                <span style={{ 
                    fontSize: 12, 
                    color: "#DC2626", 
                    marginTop: 4, 
                    display: "block" 
                }}>
                    {errorMessage}
                </span>
            )}
        </div>
    );
}
