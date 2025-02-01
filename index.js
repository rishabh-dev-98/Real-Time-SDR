console.log("launch js file");
var accessToken = "";
var rsArr = [];  // Declare rsArr globally

// Fire immediately on page load
generateAccessToken();

// Then run every 86364 seconds
setInterval(generateAccessToken, 86364);

function generateAccessToken() {
    let data = Qs.stringify({
        'grant_type': 'client_credentials',
        'client_id': 'fcc5887ba77b40bab1a8bd630c59116d',
        'client_secret': 'p8e-oMlLQqWv3hQ2IigGEJLQkqkKY2-HP9Ks',
        'scope': 'AdobeID,openid,read_organizations,additional_info.job_function,additional_info.projectedProductContext,additional_info.roles' 
    });

    let options = {
        method: 'post',
        maxBodyLength: Infinity,
        url: 'https://cors-anywhere.herokuapp.com/https://ims-na1.adobelogin.com/ims/token/v3',
        headers: { 
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-Requested-With': 'XMLHttpRequest'
        },
        data: data
    };

    axios.request(options)
        .then((response) => {
            accessToken = response.data.access_token;
            fetchToken(accessToken);
        })
        .catch((error) => {
            console.log("Error fetching token:", error);
        });
}

function fetchToken(token) {
    fetchReportSuites(token); // Fetch report suites using the token
}

function fetchReportSuites(token) {
    let rsData = {
        method: 'get',
        maxBodyLength: Infinity,
        url: 'https://analytics.adobe.io/api/bskyb0/reportsuites/collections/suites?limit=500',
        headers: { 
            'Authorization': `Bearer ${token}`,  // Pass token dynamically
            'x-api-key': 'fcc5887ba77b40bab1a8bd630c59116d'
        }
    };

    axios.request(rsData)
        .then((response) => {
            rsArr = response.data.content.map(item => item.rsid); // Update rsArr globally
        })
        .catch((error) => {
            console.log("Error fetching report suites:", error);
        });
}

// Autocomplete functionality
document.addEventListener("DOMContentLoaded", function () {
    const input = document.getElementById("rsID");
    const dropdown = document.getElementById("autocomplete-dropdown");

    input.addEventListener("input", function () {
        const value = input.value.toLowerCase();
        dropdown.innerHTML = "";

        if (value) {
            // Ensure rsArr has data before filtering
            if (rsArr.length === 0) {
                console.warn("rsArr is empty. Wait for API response.");
                return;
            }

            // Filter rsArr dynamically
            const filteredSuggestions = rsArr.filter(item => item.toLowerCase().includes(value));

            filteredSuggestions.forEach(suggestion => {
                const item = document.createElement("li");
                item.classList.add("list-group-item", "list-group-item-action");
                item.textContent = suggestion;
                item.addEventListener("click", function () {
                    input.value = suggestion;
                    input.readOnly = true;
                    dropdown.innerHTML = "";
                });
                dropdown.appendChild(item);
            });
        }
    });
});


function Submit () {
    document.getElementById('myForm').addEventListener('submit', function (event) {
        event.preventDefault(); // Prevent form submission (page reload)
    });
    function createTable (variable, type) {
        for (let i = 0; i < variable.length; ++i) {
            const newRow = document.createElement('tr');
            // Create the columns for each row dynamically
            const rowIndex = document.createElement('th');
            rowIndex.scope = 'row';
            rowIndex.textContent = document.getElementById('tableBody').rows.length + 1; // Increment the row number
            rowIndex.setAttribute("class", "text-center font-monospace")

            const adobeVariableType = document.createElement('td');
            adobeVariableType.textContent = type;
            adobeVariableType.setAttribute("class", "fst-italic font-monospace");

            const adobeVariableNumber = document.createElement('td');
            adobeVariableNumber.textContent = variable[i].number;
            adobeVariableNumber.setAttribute("class", "font-monospace");

            const adobeVariableName = document.createElement('td');
            adobeVariableName.textContent = variable[i].title;
            adobeVariableName.setAttribute("class", "font-monospace");

            const description = document.createElement('td');
            description.textContent = variable[i].description;
            description.setAttribute("class", "font-monospace");

            // Append the columns to the row
            newRow.appendChild(rowIndex);
            newRow.appendChild(adobeVariableType);
            newRow.appendChild(adobeVariableNumber);
            newRow.appendChild(adobeVariableName);
            newRow.appendChild(description);

            // Append the new row to the table body
            document.getElementById('tableBody').appendChild(newRow);
        }
    }
    const sortByNumericId = (a, b) => {
        const numA = parseInt(a.id.match(/\d+/)?.[0] || "0", 10);
        const numB = parseInt(b.id.match(/\d+/)?.[0] || "0", 10);
        return numA - numB;
    };
    var rsId = document.getElementById("rsID").value;
    if (rsId == "") {
        document.getElementById("rsFeedback").style.display = "block"
    } else if (rsId != "") {
        document.getElementById("spinner").style.display = "block"
        document.getElementById("submitButton").disabled = true;
        if (!accessToken) {
            console.warn("Access token is empty. Wait for token generation.");
            return;
        }        
        // FETCHING EVARS, PROPS, LISTVARS
        let config = {
            method: 'get',
            maxBodyLength: Infinity,
            url: 'https://analytics.adobe.io/api/bskyb0/dimensions?rsid=' + rsId,
            headers: { 
            'Authorization': `Bearer ${accessToken}`, 
            'x-api-key': 'fcc5887ba77b40bab1a8bd630c59116d'
            }
        };
        
        axios.request(config)
        .then((response) => {
            var rs = response.data;
            let evars = [];
            let props = [];
            let listVars = [];
            for (let i = 0; i < rs.length; ++i) {
                if (rs[i].id.startsWith("variables/evar") && rs[i].parent === undefined) {
                    evars.push({ id: rs[i].id, title: rs[i].title, description: rs[i].description || "No Description", number: rs[i].extraTitleInfo });
                }
                if (rs[i].id.startsWith("variables/prop") && rs[i].parent === undefined) {
                    props.push({ id: rs[i].id, title: rs[i].title, description: rs[i].description || "No Description", number: rs[i].extraTitleInfo });
                }
                if (rs[i].id.startsWith("variables/listvariable") && rs[i].parent === undefined) {
                    listVars.push({ id: rs[i].id, title: rs[i].title, description: rs[i].description || "No Description", number: (rs[i].id).split("/")[1] });
                }
            }
  
            // Sort each array
            evars.sort(sortByNumericId);
            props.sort(sortByNumericId);
            listVars.sort(sortByNumericId);
            
            createTable(evars, "eVars");
            createTable(props, "props");
            createTable(listVars, "listVars");
            

            document.getElementById("myTable").style.display = "table"
            document.getElementById("exportReset").style.display = "block"
            document.getElementById("submitButton").style.display = "none"
            document.getElementById("rsID").disabled = true;
            document.getElementById("sdrAlert").style.display = "block";
            document.getElementById("searchInput").style.display = "block"
            document.getElementById("sdrNote").style.display = "block"
            // Now fetch events
            fetchEvents();
            setTimeout(() => {
                document.getElementById("sdrAlert").style.display = "none"; // Hide alert after 5 seconds
            }, 2000);
            
            if (document.getElementById("searchInput").style.display == "block") {
                document.getElementById("spinner").style.display = "none"
                document.getElementById("clearValue").style.display = "none"
            }
        })
        .catch((error) => {
            if (rsId != "") {
                document.getElementById("rsAlert").style.display = "block"
                document.getElementById("submitButton").disabled = false;
                setTimeout(() => {
                    document.getElementById("rsAlert").style.display = "none"; // Hide alert after 5 seconds
                }, 2000);
                document.getElementById("spinner").style.display = "none"
            }
        });

        // FETCHING EVENTS
        function fetchEvents () {
            let config2 = {
                method: 'get',
                maxBodyLength: Infinity,
                url: 'https://analytics.adobe.io/api/bskyb0/metrics?rsid=' + rsId,
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'x-api-key': 'fcc5887ba77b40bab1a8bd630c59116d'
                }
            };
            
            axios.request(config2)
                .then((response) => {
                    const rs = response.data;
                    let events = [];
                    // Filter and extract IDs that start with "metrics/event"
                    for (let i = 0; i < rs.length; ++i) {
                        if (rs[i].id.startsWith("metrics/event")) {
                            events.push({ id: rs[i].id, title: rs[i].title, description: rs[i].description || "No Description", number: rs[i].extraTitleInfo });
                        }
                    }
            
                    // Sort the IDs based on the numeric part of the value
                    events.sort(sortByNumericId);
                    createTable(events, "events")
                    
                    setTimeout(() => {
                        document.getElementById("sdrAlert").style.display = "none"; // Hide alert after 5 seconds
                    }, 2000);
                })
                .catch((error) => {
                    if (rsId != "") {
                        document.getElementById("rsAlert").style.display = "block";
                        document.getElementById("submitButton").disabled = false;
                        setTimeout(() => {
                            document.getElementById("rsAlert").style.display = "none"; // Hide alert after 5 seconds
                        }, 2000);
                        document.getElementById("spinner").style.display = "none"
                    }
                });
        }
    }
}

function download () {
  document.getElementById('myForm').addEventListener('submit', function(event) {
    event.preventDefault(); // Prevent form submission (page reload)
  });
  var rsId = document.getElementById("rsID").value;
  // Get the table element
  const table = document.getElementById('myTable');
    
  // Use SheetJS to convert the table to a workbook
  const wb = XLSX.utils.table_to_book(table, { sheet: "Sheet 1" });

    // Generate an Excel file and trigger the download
    var fileName = rsId + "_SDR.xlsx"
  XLSX.writeFile(wb, fileName);
}

function resetButton () {
    document.getElementById("rsID").value = ""
    document.getElementById("submitButton").style.display = "block"
    document.getElementById("myTable").style.display = "none"
    document.getElementById("exportReset").style.display = "none"
    document.getElementById("rsID").disabled = false;
    document.getElementById('tableBody').innerHTML = ""
    document.getElementById("rsFeedback").style.display = "none"
    document.getElementById("searchInput").style.display = "none"
    document.getElementById("searchInput").value = ""
    document.getElementById("sdrNote").style.display = "none"
    document.getElementById("submitButton").disabled = false;
    document.getElementById("rsID").readOnly = false;
    document.getElementById("clearValue").style.display = "block"
}

function rsInputFocus () {
    document.getElementById("rsFeedback").style.display = "none"
}

function searchTable() {
    let input = document.getElementById("searchInput").value.toLowerCase();
    let table = document.getElementById("myTable");
    let rows = table.getElementsByTagName("tr");

    for (let i = 1; i < rows.length; i++) {  // Skip the header row
        let cells = rows[i].getElementsByTagName("td");
        let rowContainsSearchTerm = false;

        for (let j = 0; j < cells.length; j++) {
            if (cells[j].innerText.toLowerCase().includes(input)) {
                rowContainsSearchTerm = true;
                break;
            }
        }

        rows[i].style.display = rowContainsSearchTerm ? "" : "none";
    }
}

function clearButton () {
    document.getElementById("rsID").value = "";
    document.getElementById("rsID").readOnly = false;
}