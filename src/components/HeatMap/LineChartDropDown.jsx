import React from 'react'
import LineChart from '../Charts/LineChart';

const LineChartDropDown = ({labelData}) => {
    const yearlyData = {
        labels: [
            "06:00 AM", "07:00 AM", "08:00 AM", "09:00 AM", "10:00 AM", "11:00 AM", 
            "12:00 PM", "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM", "06:00 PM"
          ],
        datasets: [
          {
            label: "Rooftop PV",
            data: labelData,
            borderColor: "#FFD682",
            backgroundColor: "rgba(255, 255, 255, 0.1)",
            fill: true,
            tension: 0.4,
            borderWidth: 2,
          },
        ],
      };
  return (
    <LineChart
        data={yearlyData}
        name="Rooftop Hourly potential (in kwh)"
        xAxisLabel="Time"
        yAxisLabel="Rooftop Hourly potential (in kwh)"
      />
  )
}

export default LineChartDropDown
