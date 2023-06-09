let options = {
    option1: ["Option 1-1", "Option 1-2", "Option 1-3"],
    option2: ["Option 2-1", "Option 2-2"],
    option3: ["Option 3-1", "Option 3-2", "Option 3-3", "Option 3-4"]
};

function updateSelect2() {
    let select1 = document.getElementById("select1");
    let select2 = document.getElementById("select2");
    let selectedValue = select1.value;

    select2.innerHTML = "";

    for (let i = 0; i < options[selectedValue].length; i++) {
        let option = document.createElement("option");
        option.text = options[selectedValue][i];
        select2.add(option);
    }
}