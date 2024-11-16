$(document).ready(function() {
    let selectedRowId = null;
    let selectedDeliveryId = null;
    let staffArray = [];
    let deliveryList = [];

    // Base class for common properties
    class Person {
        constructor(id, name, surname) {
            this.id = id;
            this.name = name;
            this.surname = surname;
        }
    }

    // Staff class inheriting from Person
    class Staff extends Person {
        constructor(id, name, surname, email, status = 'In') {
            super(id, name, surname);
            this.email = email;
            this.status = status;
            this.deliveries = [];
        }
        
        clockOut() {
            const duration = prompt('Enter duration in minutes for ' + this.name + ':');
            if (duration && !isNaN(duration)) {
                this.status = 'Out';
                const outTime = new Date();
                $('#status-' + this.id).text(this.status);
                $('#out-time-' + this.id).text(outTime.toLocaleTimeString());
        
                const returnTime = new Date(outTime.getTime() + duration * 60000);
                $('#duration-' + this.id).text(formatDuration(duration));
                $('#expected-return-' + this.id).text(returnTime.toLocaleTimeString());
        
                staffMemberIsLate(this); // Kall funksjonen for å sette opp forsinkelsesvarsel
            } else {
                alert('Please enter a valid number of minutes.');
            }
        }
        

        clockIn() {
            this.status = 'In';
            $('#status-' + this.id).text(this.status);
            $('#out-time-' + this.id).text('');
            $('#duration-' + this.id).text('');
            $('#expected-return-' + this.id).text('');
            hideToast();
        }

        addDelivery(delivery) {
            this.deliveries.push(delivery);
        }
    }

    // Delivery class inheriting from Person
    class Delivery extends Person {
        constructor(id, vehicle, name, surname, telephone, address, returnTime) {
            super(id, name, surname);
            this.vehicle = vehicle;
            this.telephone = telephone;
            this.address = address;
            this.returnTime = returnTime;

            this.checkForLateReturn(); // Check if the delivery is late when added
        }

        generateDeliveryRow(index) {
            return `
                <tr id="delivery-row-${index}">
                    <td>${this.vehicle}</td>
                    <td>${this.name}</td>
                    <td>${this.surname}</td>
                    <td>${this.telephone}</td>
                    <td>${this.address}</td>
                    <td>${this.returnTime}</td>
                    <td>
                        <button class="remove-btn" onclick="confirmRemoveDelivery(${index})">Clear</button>
                    </td>
                </tr>
            `;
        }

        // Check if the driver is late and display toast notification
        checkForLateReturn() {
            const now = new Date();
            const returnDateTime = new Date(this.returnTime);
            if (now > returnDateTime) {
                showDeliveryToast(this); // Show toast for late delivery
            } else {
                const delay = returnDateTime - now;
                setTimeout(() => {
                    showDeliveryToast(this);    
                }, delay);
            }
        }
    }

    function staffMemberIsLate(staff) {
        const now = new Date();
        const expectedReturnTime = new Date($('#expected-return-' + staff.id).text());
        if (now > expectedReturnTime) {
            showStaffToast(staff); // Show toast for late staff member
        } else {
            const delay = expectedReturnTime - now;
            setTimeout(() => {
                showStaffToast(staff);
            }, delay);
        }
    }

    function showStaffToast(staff) {
        const toast = $('#toast');
        toast.html(`
            <div>
                Staff member ${staff.name} ${staff.surname} is late! <br>
                Expected Return: ${$('#expected-return-' + staff.id).text()}
            </div>
            <button id="close-toast" onclick="hideToast()">Close</button>
        `);
        toast.css('display', 'block');
    }

    function addDelivery() {
        const vehicle = document.getElementById('vehicleType').value;
        const name = document.getElementById('driverName').value;
        const surname = document.getElementById('driverSurname').value;
        const telephone = document.getElementById('telephone').value;
        const address = document.getElementById('address').value;
        const returnTime = document.getElementById('returnTime').value;

        if (name && surname && telephone && address && returnTime) {
            const newDelivery = new Delivery(deliveryList.length + 1, vehicle, name, surname, telephone, address, returnTime);
            deliveryList.push(newDelivery);
            renderDeliveryBoard();
            clearDeliveryForm();
        } else {
            alert("Please fill in all fields before adding the delivery.");
        }
    }

    function renderDeliveryBoard() {
        const deliveryBoardBody = document.querySelector("#deliveryBoard tbody");
        deliveryBoardBody.innerHTML = "";
        deliveryList.forEach((delivery, index) => {
            deliveryBoardBody.innerHTML += delivery.generateDeliveryRow(index);
        });
    }

    document.getElementById('addDeliveryBtn').addEventListener('click', addDelivery);

    // Fetch staff from randomuser.me API
    fetch('https://randomuser.me/api/?results=5')
        .then(response => response.json())
        .then(data => {
            data.results.forEach((user, index) => {
                const staff = new Staff(
                    index + 1,
                    user.name.first,
                    user.name.last,
                    user.email
                );
                staffArray.push(staff);

                $('#staffTable tbody').append(`
                    <tr id="row-${staff.id}" data-id="${staff.id}">
                        <td><img src="${user.picture.thumbnail}" alt="profile" width="50"></td>
                        <td>${staff.name}</td>
                        <td>${staff.surname}</td>
                        <td>${staff.email}</td>
                        <td id="status-${staff.id}">${staff.status}</td>
                        <td id="out-time-${staff.id}"></td>
                        <td id="duration-${staff.id}"></td>
                        <td id="expected-return-${staff.id}"></td>
                    </tr>
                `);

                // Set a timeout to check for lateness
                staffMemberIsLate(staff);

                $(`#row-${staff.id}`).on('click', function() {
                    $('.selected-row').removeClass('selected-row');
                    $(this).addClass('selected-row');
                    selectedRowId = staff.id;
                });
            });
        });

    $('#out-button').on('click', function() {
        if (selectedRowId !== null) {
            const selectedStaff = staffArray.find(s => s.id === selectedRowId);
            selectedStaff.clockOut();
            staffMemberIsLate(selectedStaff); // Set lateness check
        } else {
            alert('Please select a staff member first.');
        }
    });

    $('#in-button').on('click', function() {
        if (selectedRowId !== null) {
            const selectedStaff = staffArray.find(s => s.id === selectedRowId);
            selectedStaff.clockIn();
        } else {
            alert('Please select a staff member first.');
        }
    });

    function formatDuration(minutes) {
        const hrs = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return hrs > 0 ? `${hrs}hr ${mins}min` : `${mins}min`;
    }

    function hideToast() {
        $('#toast').css('display', 'none');
    }
});
