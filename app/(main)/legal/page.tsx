export default function LegalPage() {
    return (
        <main className="min-h-screen bg-netflix-black px-4 md:px-12 py-20">
            <div className="max-w-3xl mx-auto space-y-12">
                <section>
                    <h1 className="text-4xl font-display text-white mb-6">Legal Information</h1>
                    <p className="text-gray-400 mb-4">
                        Last updated: {new Date().toLocaleDateString()}
                    </p>
                    <div className="prose prose-invert">
                        <h3>Terms of Service</h3>
                        <p>
                            Welcome to ILikeMovies. By accessing or using our website, you agree to be bound by these terms.
                            This is a demonstration project and does not provide real streaming services for commercial use.
                        </p>

                        <h3 className="mt-8">Privacy Policy</h3>
                        <p>
                            We value your privacy. This application stores your watchlist preferences and viewing history locally or via Supabase for demonstration purposes.
                            We do not share your personal data with third parties.
                        </p>
                    </div>
                </section>
            </div>
        </main>
    );
}
