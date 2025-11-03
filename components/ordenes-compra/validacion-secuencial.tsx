import type React from "react"

interface ValidacionSecuencialProps {
  orden: any // Replace 'any' with a more specific type if possible
}

const ValidacionSecuencial: React.FC<ValidacionSecuencialProps> = ({ orden }) => {
  return (
    <div>
      {/* Other components and content related to validation */}
      <div>
        {/* Example table or section where customerId is displayed */}
        <table>
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              {/* Other headers */}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{orden.id}</td>
              <td>
                <div className="text-sm font-medium">Cliente: {String(orden.customerId || "").replace(/,/g, "")}</div>
              </td>
              {/* Other data */}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Ensure customerId is displayed consistently elsewhere */}
      {orden.otherCustomerId && (
        <div>
          Other Customer ID:
          <div className="text-sm font-medium">Cliente: {String(orden.otherCustomerId || "").replace(/,/g, "")}</div>
        </div>
      )}
    </div>
  )
}

export { ValidacionSecuencial }
export default ValidacionSecuencial
