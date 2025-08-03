import { requireAuth } from '@/lib/auth-utils';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function DashboardPage() {
  const session = await requireAuth();

  // Get user's recent searches
  const { data: recentSearches } = await supabase
    .from('search_logs')
    .select('*')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false })
    .limit(10);

  // Get user's saved domains
  const { data: savedDomains } = await supabase
    .from('user_domains')
    .select(`
      *,
      domain:domain_intelligence(*)
    `)
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false });

  return (
    <div className="min-h-screen bg-gradient-luxury p-6">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-light text-gray-900 mb-2">
            Welcome back, {session.user.name || session.user.email}
          </h1>
          <div className="flex items-center gap-4">
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
              {session.user.subscriptionTier} Plan
            </span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              session.user.subscriptionStatus === 'active' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {session.user.subscriptionStatus}
            </span>
          </div>
        </header>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Recent Searches */}
          <div className="lg:col-span-2 card-luxury">
            <h2 className="text-xl font-medium text-gray-900 mb-6">Recent Searches</h2>
            {recentSearches && recentSearches.length > 0 ? (
              <div className="space-y-4">
                {recentSearches.map((search: any) => (
                  <div key={search.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{search.query}</p>
                      <p className="text-sm text-gray-600">
                        {search.results_count} results • {search.response_time}ms
                      </p>
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(search.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">No searches yet. Start by searching for domains!</p>
            )}
          </div>

          {/* Saved Domains */}
          <div className="card-luxury">
            <h2 className="text-xl font-medium text-gray-900 mb-6">Saved Domains</h2>
            {savedDomains && savedDomains.length > 0 ? (
              <div className="space-y-3">
                {savedDomains.map((userDomain: any) => (
                  <div key={userDomain.id} className="p-3 bg-gray-50 rounded-lg">
                    <p className="font-medium text-gray-900">{userDomain.domain?.domain}</p>
                    <p className="text-sm text-gray-600 capitalize">{userDomain.action}</p>
                    {userDomain.domain?.grab_score && (
                      <p className="text-sm text-blue-600">Score: {userDomain.domain.grab_score}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">No saved domains yet.</p>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 card-luxury">
          <h2 className="text-xl font-medium text-gray-900 mb-6">Quick Actions</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <button className="p-6 text-left bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
              <h3 className="font-medium text-blue-900 mb-2">New Search</h3>
              <p className="text-sm text-blue-700">Find your perfect domain</p>
            </button>
            <button className="p-6 text-left bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
              <h3 className="font-medium text-green-900 mb-2">Bulk Analysis</h3>
              <p className="text-sm text-green-700">Analyze multiple domains</p>
            </button>
            <button className="p-6 text-left bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors">
              <h3 className="font-medium text-purple-900 mb-2">Set Alerts</h3>
              <p className="text-sm text-purple-700">Get notified of opportunities</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}