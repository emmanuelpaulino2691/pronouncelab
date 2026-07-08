import MainLayout from "../../shared/layouts/MainLayout";

function TheoryPage() {
  return (
    <MainLayout>
      <h1 className="text-3xl font-bold">
        Theory
      </h1>

      <div className="mt-6 rounded-xl bg-white p-6 shadow">
        <h2 className="text-xl font-semibold">
          Introduction to English Sounds
        </h2>

        <p className="mt-4 text-slate-600 leading-8">
          English has many vowel and consonant sounds.
          Learning to recognize and pronounce them correctly
          is the first step toward speaking naturally.
        </p>
      </div>
    </MainLayout>
  );
}

export default TheoryPage;