import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { userLoggedIn } from "../auth/authSlice";

// Khai báo type cho window.__ENV__
declare global {
  interface Window {
    __ENV__?: {
      NEXT_PUBLIC_SERVER_URI?: string;
    };
  }
}

// Hàm xác định baseUrl với logic fallback phù hợp
const getBaseUrl = () => {
  // Sử dụng URL production mặc định trong môi trường production
  /*if (process.env.NODE_ENV === 'production') {
    console.log("API URL: Sử dụng URL production mặc định");
    return "https://api.studynow.space/api/v1/";
  }*/
  
  // Sử dụng biến môi trường nếu có
  const envUrl = process.env.NEXT_PUBLIC_SERVER_URI;
  if (envUrl) {
    console.log("API URL: Sử dụng từ env", envUrl);
    return envUrl;
  }
  
  // Fallback cuối cùng về localhost
  console.log("API URL: Fallback về localhost");
  return "http://localhost:8000/api/v1/";
};

// Log để debug
const baseUrl = getBaseUrl();
console.log("Final baseUrl used:", baseUrl);

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl,
  }),
  endpoints: (builder) => ({
    refreshToken: builder.query({
      query: (data) => ({
        url: "refresh",
        method: "GET",
        credentials: "include" as const,
      }),
    }),
    loadUser: builder.query({
      query: (data) => ({
        url: "me",
        method: "GET",
        credentials: "include" as const,
      }),
      async onQueryStarted(arg, { queryFulfilled, dispatch }) {
        try {
          const result = await queryFulfilled;
          dispatch(
            userLoggedIn({
              accessToken: result.data.accessToken,
              user: result.data.user,
            })
          );
        } catch (error: any) {
          console.log(error);
        }
      },
    }),
  }),
});


export const { useRefreshTokenQuery, useLoadUserQuery } = apiSlice;
