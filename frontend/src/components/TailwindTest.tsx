// src/components/TailwindTest.tsx
const TailwindTest = () => {
  return (
    <div className="p-8 space-y-6">
      <h1 className="text-3xl font-bold mb-6">Tailwind Config Test</h1>
      
      {/* Color Test */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Colors</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-pink rounded-lg border border-dark-grey">
            <p className="text-sm">bg-pink</p>
            <p className="text-xs">#FFD5EC</p>
          </div>
          <div className="p-4 bg-purple rounded-lg text-white">
            <p className="text-sm">bg-purple</p>
            <p className="text-xs">#CEAFEA</p>
          </div>
          <div className="p-4 bg-muted-purple rounded-lg text-white">
            <p className="text-sm">bg-muted-purple</p>
            <p className="text-xs">#89769F</p>
          </div>
          <div className="p-4 bg-dark-purple rounded-lg text-white">
            <p className="text-sm">bg-dark-purple</p>
            <p className="text-xs">#6C46AC</p>
          </div>
        </div>
      </div>

      {/* Font Test */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Fonts & Text Sizes</h2>
        <div className="space-y-3">
          <h1 className="text-header text-dark-grey font-montserrat border-b pb-2">
            Header - Montserrat Bold 20px
          </h1>
          <p className="text-big-text text-dark-grey font-montserrat">
            Big Text - Montserrat Semibold 16px
          </p>
          <button className="text-button-text bg-dark-yellow text-dark-grey px-4 py-2 rounded font-montserrat">
            Button Text - Semibold 14px
          </button>
          <p className="text-fill-text text-dark-grey font-montserrat">
            Fill Text - Medium 12px - This is used for form inputs and labels
          </p>
        </div>
      </div>

      {/* Background Test */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Gradient Background</h2>
        <div className="h-32 bg-gradient-to-b from-pink to-purple rounded-lg flex items-center justify-center text-white font-montserrat">
          bg-gradient-to-b from-pink to-purple
        </div>
      </div>
    </div>
  );
};

export default TailwindTest;