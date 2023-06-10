generateOptions(document.getElementById('parentSelect[0]'), document.getElementById('childSelect[0]'), document.getElementById('years[0]'));
generateOptions(document.getElementById('parentSelect[1]'), document.getElementById('childSelect[1]'), document.getElementById('years[1]'));


function generateOptions(parentElement, childElement, yearsElement) {

    parentElement.addEventListener('change', function (event) {
        updateSelect2(event.target.value, childElement, yearsElement);
    })

    loadData()
        .then(function (data) {
            for (let i = 0; i < data.length; i++) {
                let option = document.createElement('option');
                option.value = i;
                option.innerHTML = data[i]['title'];
                parentElement.appendChild(option);
            }

            reloadChildSelects(data, 0, childElement, yearsElement);
        })
        .catch(function (error) {
            console.error(error);
        });
}



function updateSelect2(currentParentIndex, childElement, yearsElement) {
    childElement.innerHTML = "";
    yearsElement.innerHTML = "";

    loadData().then(function (data) {
            reloadChildSelects(data, currentParentIndex, childElement, yearsElement);
        })
        .catch(function (error) {
            console.error(error);
        });

}

function reloadChildSelects(data, currentParentIndex, childElement, yearsElement) {
    for (let j = 0; j < data[currentParentIndex]['options'].length; j++) {
        let option = document.createElement('option');
        option.value = j;
        option.innerHTML = data[currentParentIndex]['options'][j];
        childElement.appendChild(option);
    }

    for (let i = 0; i < data[currentParentIndex]['years'].length; i++) {
        let option = document.createElement('option');
        option.value = i;
        option.innerHTML = data[currentParentIndex]['years'][i];
        yearsElement.appendChild(option);
    }
}