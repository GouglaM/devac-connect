import React from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

interface RichTextEditorProps {
    value: string;
    onChange: (content: string) => void;
    placeholder?: string;
    className?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange, placeholder, className }) => {
    const modules = {
        toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            [{ 'font': [] }],
            [{ 'size': ['small', false, 'large', 'huge'] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'color': [] }, { 'background': [] }],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            [{ 'align': [] }],
            ['clean']
        ],
    };

    const formats = [
        'header', 'font', 'size',
        'bold', 'italic', 'underline', 'strike',
        'color', 'background',
        'list', 'bullet',
        'align'
    ];

    return (
        <div className={`rich-text-editor bg-white rounded-xl overflow-hidden border border-slate-200 focus-within:border-indigo-400 transition-all ${className}`}>
            <ReactQuill
                theme="snow"
                value={value}
                onChange={onChange}
                modules={modules}
                formats={formats}
                placeholder={placeholder}
                className="quill-editor"
            />
            <style>{`
                .quill-editor .ql-toolbar {
                    border: none;
                    border-bottom: 1px solid #f1f5f9;
                    background: #f8fafc;
                    padding: 8px 12px;
                }
                .quill-editor .ql-container {
                    border: none;
                    min-height: 120px;
                    font-family: inherit;
                    font-size: 13px;
                }
                .quill-editor .ql-editor {
                    padding: 12px 16px;
                    line-height: 1.6;
                }
                .quill-editor .ql-editor.ql-blank::before {
                    color: #94a3b8;
                    font-style: normal;
                    left: 16px;
                }
                .quill-editor .ql-snow .ql-picker.ql-header { width: 90px; }
                .quill-editor .ql-snow .ql-picker.ql-size { width: 70px; }
            `}</style>
        </div>
    );
};

export default RichTextEditor;
