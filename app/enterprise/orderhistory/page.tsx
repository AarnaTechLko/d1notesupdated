"use client";
import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import PaymentDatatable from '../../components/PaymentDatatable';
import Sidebar from '../../components/enterprise/Sidebar';
import { useSession,getSession } from 'next-auth/react';

// Define the type for the data
interface Order {
    id: number;
    orderDate: string;
    packageName: string;
    description: string;
    amount: number;
    
  }
  


const Home: React.FC = () => {
    const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState<string>('');
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
    const limit = 10; // Set the number of items per page
    const defaultSort = 'name,asc';
    const { data: session } = useSession();
    useEffect(() => {
        const fetchOrders = async () => {
            const session = await getSession();
            const enterpriseId = session?.user?.id; // Adjust according to your session structure
          
            if (!enterpriseId) {
              console.error('Enterprise ID not found in session');
              return;
            }
          
            const response = await fetch('/api/enterprise/orderhistory', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json', // Specify that we're sending JSON data
                },
                body: JSON.stringify({
                  enterprise_id: enterpriseId, // Include the enterprise_id in the request body
                }),
              });
            
            if (!response.ok) {
              console.error('Failed to fetch orders');
              return;
            }
          
            const data = await response.json();
            setOrders(data.orderWithPackageDetails);
            setFilteredOrders(data.orderWithPackageDetails); // Initially show all orders
          };
    
        fetchOrders();
      }, []);
    useEffect(() => {
        if (search) {
            const filtered = orders.filter((order) =>
                order.packageName.toLowerCase().includes(search.toLowerCase()) ||
                order.amount.toString().includes(search.toLowerCase()) // Convert number to string
              );
          setFilteredOrders(filtered);
        } else {
          setFilteredOrders(orders);
        }
      }, [search, orders]);

    return (
        <div className="flex h-screen overflow-hidden">
            <Sidebar />
            <main className="flex-grow bg-gray-100 p-4 overflow-auto">
                <div className="bg-white shadow-md rounded-lg p-6 h-auto">
                <div>
 
      <input
        type="text"
        placeholder="Search by customer name or status"
        className="w-1/3 mb-2 px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <table>
        <thead>
          <tr>
            
            <th>Order Date</th>
            <th>Package Name</th>
            <th>Description</th>
            <th>Amount Paid</th>
            
          </tr>
        </thead>  
        <tbody>
          {filteredOrders.length > 0 ? (
            filteredOrders.map((order) => (
              <tr key={order.id}>
               
                <td>{order.orderDate}</td>
                <td>{order.packageName}</td>
                <td>{order.description}</td>
                <td>{order.amount}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={5}>No orders found</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
                </div>
            </main>
        </div>
    );
};

export default Home;
