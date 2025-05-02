import { styles } from "@/app/styles/style";
import { useCreateOrderMutation } from "@/redux/features/orders/ordersApi";
import { redirect } from "next/navigation";
import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import socketIO from "socket.io-client";
const ENDPOINT = process.env.NEXT_PUBLIC_SOCKET_SERVER_URI || "";
const socketId = socketIO(ENDPOINT, { transports: ["websocket"] });

type Props = {
  setOpen: any;
  data: any;
  user: any;
  refetch: any;
};

const CheckOutForm = ({ data, user, refetch }: Props) => {
  const [message, setMessage] = useState<any>("");
  const [createOrder, { data: orderData, error }] = useCreateOrderMutation();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    
    // Hiển thị trạng thái "đang xử lý thanh toán"
    setIsLoading(true);
    setMessage("Processing payment, please wait...");
    
    // Tạo đối tượng paymentIntent giả lập thanh toán thành công
    const mockPaymentIntent = {
      id: `pi_${Math.random().toString(36).substring(2, 15)}`,
      amount: data.price * 100,
      status: "succeeded",
      created: Date.now() / 1000,
      currency: "usd",
    };
    
    // Gọi API createOrder với thông tin giả lập
    createOrder({ courseId: data._id, payment_info: mockPaymentIntent });
    
    // Thêm setTimeout để tạo độ trễ ngẫu nhiên (2-4 giây)
    const randomDelay = Math.floor(Math.random() * 2000) + 2000; // 2-4 giây
    setTimeout(() => {
      // Thông báo thanh toán thành công 
      setMessage("Payment successful! Redirecting...");
    }, randomDelay - 1000); // Hiển thị thông báo trước khi redirect
  };

  useEffect(() => {
    if (orderData) {
      refetch();
      socketId.emit("notification", {
        title: "New Order",
        message: `You have a new order from ${data.name}`,
        userId: user._id,
      });
      redirect(`/course-access/${data._id}`);
    }
    if (error) {
      if ("data" in error) {
        const errorMessage = error as any;
        toast.error(errorMessage.data.message);
      }
    }
  }, [orderData, error]);

  return (
    <form id="payment-form" onSubmit={handleSubmit}>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-500 mb-2">Card Information</label>
        <div className="border border-gray-300 dark:border-gray-600 rounded-md p-3 bg-white dark:bg-gray-800">
          {/* Giả lập giao diện thẻ thanh toán */}
          <div className="mb-3">
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Card Number</label>
            <div className="h-10 rounded bg-gray-100 dark:bg-gray-700 px-3 flex items-center">
              **** **** **** 4242
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Expiration Date</label>
              <div className="h-10 rounded bg-gray-100 dark:bg-gray-700 px-3 flex items-center">
                12/25
              </div>
            </div>
            <div className="w-24">
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">CVC</label>
              <div className="h-10 rounded bg-gray-100 dark:bg-gray-700 px-3 flex items-center">
                ***
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <button disabled={isLoading} id="submit" className="w-full">
        <span id="button-text" className={`${styles.button} mt-2 !h-[45px] w-full flex items-center justify-center`}>
          {isLoading ? "Processing..." : `Payment of ${data.price}$`}
        </span>
      </button>
      {/* Show any error or success messages */}
      {message && (
        <div id="payment-message" className={`font-Poppins text-center pt-4 ${message.includes("successful") ? "text-green-500" : "text-[red]"}`}>
          {message}
        </div>
      )}
    </form>
  );
};

export default CheckOutForm;