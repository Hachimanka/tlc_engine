import React from "react";

const plans = [
	{
		name: "Starter",
		price: "Free",
		tenants: 20,
		features: [
			"5 instructors",
			"Basic computation",
			"1 department",
		],
	},
	{
		name: "Basic",
		price: "$90",
		tenants: 20,
		features: [
			"5 instructors",
			"Basic computation",
			"1 department",
		],
	},
	{
		name: "Premium",
		price: "$1999",
		tenants: 20,
		features: [
			"5 instructors",
			"Basic computation",
			"1 department",
		],
	},
	{
		name: "Diamond",
		price: "$9999",
		tenants: 20,
		features: [
			"5 instructors",
			"Basic computation",
			"1 department",
		],
	},
];

export default function SubscriptionCards() {
	return (
		<div className="w-full px-8 py-6">
			<h1 className="text-2xl font-bold text-teal-800 mb-2">SUBSCRIPTIONS</h1>
			<div className="border-b border-teal-200 mb-6" />
			<div className="flex flex-row gap-6 flex-wrap">
				{plans.map((plan) => (
					<div
						key={plan.name}
						className="bg-white rounded-xl shadow p-6 min-w-[240px] max-w-[270px] flex flex-col gap-4 relative flex-1"
						style={{ minHeight: 340 }}
					>
						<div className="flex items-center justify-between">
							<span className="text-lg font-semibold text-teal-800">{plan.name}</span>
							<span className="bg-teal-50 text-teal-700 rounded-full px-3 py-1 text-xs font-medium shadow-sm border border-teal-200">{plan.tenants} tenants</span>
						</div>
						<div className="flex items-end gap-1">
							<span className="text-3xl font-bold text-teal-700">{plan.price}</span>
							<span className="text-gray-400 mb-1">/ month</span>
						</div>
						<div className="text-gray-500 text-sm mb-2">Up to 5 instructors</div>
						<ul className="flex flex-col gap-1 mb-4">
							{plan.features.map((f, i) => (
								<li key={i} className="flex items-center gap-2 text-teal-700">
									<span className="text-green-500">✔</span> {f}
								</li>
							))}
						</ul>
						<div className="flex gap-2 mt-auto">
							<button className="flex-1 bg-gray-100 text-gray-700 rounded-md px-4 py-2 font-medium shadow hover:bg-gray-200 transition">Edit</button>
							<button className="flex-1 bg-teal-700 text-white rounded-md px-4 py-2 font-medium shadow hover:bg-teal-800 transition">View Tenants</button>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
