// Export utilities for different formats

export const exportFormats = {
  CSV: 'csv',
  JSON: 'json',
  TXT: 'txt',
  HTML: 'html'
};

export const formatOptions = [
  { value: 'csv', label: 'CSV', icon: '📊', description: 'Comma-separated values' },
  { value: 'json', label: 'JSON', icon: '🔧', description: 'JavaScript Object Notation' },
  { value: 'txt', label: 'TXT', icon: '📄', description: 'Plain text file' },
  { value: 'html', label: 'HTML', icon: '🌐', description: 'Web page format' }
];

// Generate CSV content
export const generateCSV = (data, headers, title = '') => {
  let csv = '';

  if (title) {
    csv += `${title}\n`;
    csv += `Generated at: ${new Date().toLocaleString()}\n\n`;
  }

  // Add headers
  if (headers && headers.length > 0) {
    csv += headers.join(',') + '\n';
  }

  // Add data rows
  data.forEach(row => {
    const values = headers ? headers.map(header => {
      const value = row[header] || '';
      // Escape commas and quotes in CSV
      return typeof value === 'string' && (value.includes(',') || value.includes('"'))
        ? `"${value.replace(/"/g, '""')}"`
        : value;
    }) : Object.values(row);
    csv += values.join(',') + '\n';
  });

  return csv;
};

// Generate JSON content
export const generateJSON = (data, title = '') => {
  const exportData = {
    title,
    generatedAt: new Date().toISOString(),
    data
  };
  return JSON.stringify(exportData, null, 2);
};

// Generate TXT content
export const generateTXT = (data, headers, title = '') => {
  let txt = '';

  if (title) {
    txt += `${title}\n`;
    txt += '='.repeat(title.length) + '\n';
    txt += `Generated at: ${new Date().toLocaleString()}\n\n`;
  }

  data.forEach((row, index) => {
    txt += `Record ${index + 1}:\n`;
    txt += '-'.repeat(20) + '\n';

    if (headers) {
      headers.forEach(header => {
        txt += `${header}: ${row[header] || 'N/A'}\n`;
      });
    } else {
      Object.entries(row).forEach(([key, value]) => {
        txt += `${key}: ${value || 'N/A'}\n`;
      });
    }
    txt += '\n';
  });

  return txt;
};

// Generate HTML content
export const generateHTML = (data, headers, title = '') => {
  let html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title || 'Export Data'}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px; }
        .meta { color: #666; margin-bottom: 20px; }
        table { border-collapse: collapse; width: 100%; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f8f9fa; font-weight: bold; }
        tr:nth-child(even) { background-color: #f9f9f9; }
        tr:hover { background-color: #f5f5f5; }
        .summary { background-color: #e7f3ff; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
    </style>
</head>
<body>`;

  if (title) {
    html += `    <h1>${title}</h1>`;
    html += `    <div class="meta">Generated on: ${new Date().toLocaleString()}</div>`;
    html += `    <div class="summary">Total Records: ${data.length}</div>`;
  }

  html += `    <table>`;

  // Add headers
  if (headers && headers.length > 0) {
    html += `        <thead><tr>`;
    headers.forEach(header => {
      html += `<th>${header}</th>`;
    });
    html += `</tr></thead>`;
  }

  // Add data rows
  html += `        <tbody>`;
  data.forEach(row => {
    html += `        <tr>`;
    if (headers) {
      headers.forEach(header => {
        html += `<td>${row[header] || ''}</td>`;
      });
    } else {
      Object.values(row).forEach(value => {
        html += `<td>${value || ''}</td>`;
      });
    }
    html += `</tr>`;
  });
  html += `        </tbody>`;
  html += `    </table>
</body>
</html>`;

  return html;
};

// Main export function
export const exportData = (data, headers, filename, format, title = '') => {
  let content = '';
  let mimeType = '';
  let fileExtension = '';

  switch (format) {
    case 'csv':
      content = generateCSV(data, headers, title);
      mimeType = 'text/csv;charset=utf-8;';
      fileExtension = 'csv';
      break;
    case 'json':
      content = generateJSON(data, title);
      mimeType = 'application/json;charset=utf-8;';
      fileExtension = 'json';
      break;
    case 'txt':
      content = generateTXT(data, headers, title);
      mimeType = 'text/plain;charset=utf-8;';
      fileExtension = 'txt';
      break;
    case 'html':
      content = generateHTML(data, headers, title);
      mimeType = 'text/html;charset=utf-8;';
      fileExtension = 'html';
      break;
    default:
      throw new Error(`Unsupported format: ${format}`);
  }

  // Create and download file
  const blob = new Blob([content], { type: mimeType });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.${fileExtension}`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
};

// Generate comprehensive admin report
export const generateAdminReport = (reportData, format) => {
  const date = new Date().toISOString().split('T')[0];
  const filename = `admin-report-${date}`;
  const title = 'Admin Dashboard Report';

  if (format === 'csv') {
    // CSV format - multiple sections
    let csvContent = `${title}\n`;
    csvContent += `Generated at: ${new Date(reportData.generatedAt).toLocaleString()}\n\n`;

    // Platform Statistics
    csvContent += "PLATFORM STATISTICS\n";
    csvContent += "Metric,Value\n";
    csvContent += `Total Users,${reportData.stats.users?.total || 0}\n`;
    csvContent += `Active Hosts,${reportData.stats.users?.hosts || 0}\n`;
    csvContent += `Customer Users,${reportData.stats.users?.customers || 0}\n`;
    csvContent += `Total Listings,${reportData.stats.listings?.total || 0}\n`;
    csvContent += `Active Listings,${reportData.stats.listings?.active || 0}\n`;
    csvContent += `Total Orders,${reportData.stats.orders?.total || 0}\n`;
    csvContent += `Completed Orders,${reportData.stats.orders?.completed || 0}\n`;
    csvContent += `Platform Revenue,₹${reportData.stats.revenue?.total || 0}\n`;
    csvContent += `Pending Payouts,₹${reportData.stats.payouts?.pending || 0}\n\n`;

    // Recent Orders
    csvContent += "RECENT ORDERS\n";
    csvContent += "Order ID,Customer,Amount,Status,Date\n";
    reportData.recentOrders.forEach((order) => {
      csvContent += `${order._id || 'N/A'},${order.customer?.name || 'N/A'},₹${order.total || 0},${order.orderStatus || 'N/A'},${new Date(order.createdAt).toLocaleDateString()}\n`;
    });

    csvContent += "\n";

    // Top Listings
    csvContent += "TOP LISTINGS\n";
    csvContent += "Title,Host,Revenue,Bookings\n";
    reportData.topListings.forEach((listing) => {
      csvContent += `"${listing.title || 'N/A'}",${listing.host?.name || 'N/A'},₹${listing.revenue || 0},${listing.bookings || 0}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } else {
    // For other formats, use the general export function
    const data = [
      { section: 'Statistics', ...reportData.stats },
      ...reportData.recentOrders.map(order => ({ section: 'Recent Order', ...order })),
      ...reportData.topListings.map(listing => ({ section: 'Top Listing', ...listing }))
    ];

    exportData(data, Object.keys(data[0] || {}), filename, format, title);
  }
};
