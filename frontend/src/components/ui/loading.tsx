const Loading = () => {
    return (
        <div className="flex h-screen items-center justify-center">
            <div className="flex flex-col items-center gap-3">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-muted border-t-primary" />
                <p className="text-sm text-muted-foreground">Đang tải trang...</p>
            </div>
        </div>
    );
};

export default Loading;

// export default function LoadingScreen() {
//   return (
//     <div className="fixed inset-0 flex items-center justify-center bg-white">
//       <div className="flex flex-col items-center gap-4">
//         <div className="relative w-16 h-16">
//           <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
//           <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
//         </div>
//         <p className="text-gray-600">Loading...</p>
//       </div>
//     </div>
//   );
// }
