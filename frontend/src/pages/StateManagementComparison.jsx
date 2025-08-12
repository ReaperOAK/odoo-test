import { Link } from "react-router-dom";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";

const StateManagementComparison = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          State Management Comparison
        </h1>
        <p className="text-gray-600 mt-2">
          Compare TanStack Query vs Pure React Context approaches for managing
          listings data
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* TanStack Query + Context */}
        <Card>
          <Card.Content className="p-6">
            <h2 className="text-2xl font-bold text-blue-600 mb-4">
              TanStack Query + Context
            </h2>

            <div className="space-y-4 mb-6">
              <div>
                <h3 className="font-semibold text-gray-900">✅ Advantages:</h3>
                <ul className="text-sm text-gray-600 list-disc list-inside space-y-1 mt-2">
                  <li>Automatic background refetching</li>
                  <li>Built-in caching with stale-while-revalidate</li>
                  <li>Loading states handled automatically</li>
                  <li>Error retry logic built-in</li>
                  <li>Optimistic updates with rollback</li>
                  <li>DevTools for debugging</li>
                  <li>Memory management</li>
                  <li>Network status awareness</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900">
                  ⚠️ Considerations:
                </h3>
                <ul className="text-sm text-gray-600 list-disc list-inside space-y-1 mt-2">
                  <li>Additional bundle size (~13KB)</li>
                  <li>Learning curve for query concepts</li>
                  <li>More complex for simple apps</li>
                </ul>
              </div>
            </div>

            <div className="space-y-3">
              <Button asChild className="w-full">
                <Link to="/host/dashboard">View Dashboard</Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link to="/listings/new">Create Listing</Link>
              </Button>
            </div>
          </Card.Content>
        </Card>

        {/* Pure React Context */}
        <Card>
          <Card.Content className="p-6">
            <h2 className="text-2xl font-bold text-green-600 mb-4">
              Pure React Context
            </h2>

            <div className="space-y-4 mb-6">
              <div>
                <h3 className="font-semibold text-gray-900">✅ Advantages:</h3>
                <ul className="text-sm text-gray-600 list-disc list-inside space-y-1 mt-2">
                  <li>No external dependencies</li>
                  <li>Full control over state logic</li>
                  <li>Simpler mental model</li>
                  <li>Smaller bundle size</li>
                  <li>Custom error handling</li>
                  <li>Easy to understand flow</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900">
                  ⚠️ Considerations:
                </h3>
                <ul className="text-sm text-gray-600 list-disc list-inside space-y-1 mt-2">
                  <li>Manual cache management</li>
                  <li>No automatic background refetch</li>
                  <li>Manual loading/error states</li>
                  <li>No retry logic</li>
                  <li>More boilerplate code</li>
                  <li>Memory leaks if not careful</li>
                  <li>No network status awareness</li>
                </ul>
              </div>
            </div>

            <div className="space-y-3">
              <Button asChild className="w-full">
                <Link to="/host/dashboard-context">View Dashboard</Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link to="/listings/new-context">Create Listing</Link>
              </Button>
            </div>
          </Card.Content>
        </Card>
      </div>

      <Card className="mt-8">
        <Card.Content className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Recommendation
          </h2>
          <div className="space-y-4">
            <p className="text-gray-700">
              <strong>For your rental marketplace:</strong> I recommend using{" "}
              <strong>TanStack Query + Context</strong> because:
            </p>
            <ul className="text-gray-600 list-disc list-inside space-y-1 ml-4">
              <li>Better user experience with automatic data syncing</li>
              <li>Handles network issues gracefully</li>
              <li>Reduces boilerplate code significantly</li>
              <li>Provides excellent caching for frequently accessed data</li>
              <li>Scales well as your app grows</li>
            </ul>
            <p className="text-gray-700">
              The Context layer gives you centralized control while TanStack
              Query handles all the complex server state management.
            </p>
          </div>
        </Card.Content>
      </Card>

      <Card className="mt-6">
        <Card.Content className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Implementation Status
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-blue-600">
                TanStack Query + Context
              </h4>
              <ul className="text-sm text-gray-600 space-y-1 mt-2">
                <li>✅ Dashboard auto-refresh working</li>
                <li>✅ Optimistic updates implemented</li>
                <li>✅ Cache invalidation working</li>
                <li>✅ Error handling in place</li>
                <li>✅ Loading states managed</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-green-600">Pure React Context</h4>
              <ul className="text-sm text-gray-600 space-y-1 mt-2">
                <li>✅ Manual state management</li>
                <li>✅ Custom reducer logic</li>
                <li>✅ Explicit data fetching</li>
                <li>✅ Manual error handling</li>
                <li>✅ Custom loading states</li>
              </ul>
            </div>
          </div>
        </Card.Content>
      </Card>
    </div>
  );
};

export default StateManagementComparison;
