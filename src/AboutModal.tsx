interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AboutModal({ isOpen, onClose }: AboutModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="py-6 px-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-white">gcoordinator-web</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white text-2xl leading-none"
            >
              ×
            </button>
          </div>

          <div className="space-y-4 text-gray-300">
            <section className="space-y-3">
              <h3 className="text-lg font-semibold text-white mb-2">About</h3>
              <p>
                gcoordinator-web is a G-code generation software for 3D printing that 
                allows you to create 3D models using Python code.
              </p>
              <p>
                This is a browser-based frontend of{" "}
                <a
                  href="https://github.com/tomohiron907/gcoordinator"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 underline"
                >
                  gcoordinator
                </a>
                , a Python library created by <strong>tomohiron907</strong>. This web version has been 
                adapted with reduced dependencies to run entirely in the browser using 
                Pyodide, making G-code generation accessible without any server-side 
                installation.
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="text-lg font-semibold text-white mb-2">License</h3>
              <p>
                <strong>gcoordinator</strong> © 2023 tomohiron907{" "}
                <a
                  href="https://opensource.org/licenses/MIT"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 underline"
                >
                  MIT License
                </a>
                .
              </p>
                            <p>
                <strong>gcoordinator-web</strong> © 2026 e04{" "}
                <a
                  href="https://opensource.org/licenses/MIT"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 underline"
                >
                  MIT License
                </a>
                .
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
