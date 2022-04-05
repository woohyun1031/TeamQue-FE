import { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import api from '../../api';
import ModalCloseButton from './ModalCloseButton';
import AWS from 'aws-sdk';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/configStore';

const ModifyClass = () => {
	const [selectedDays, setSelectedDays] = useState<any>([]);
	const [inputs, setInputs] = useState({
		title: '',
		imageUrl: '',
		startDate: '',
		endDate: '',
		day: '',
		startTime: '',
		endTime: '',
	});
	//image
	const [file, setFile] = useState<any>('');
	const [isImage, setIsImage] = useState(false);
	const navigate = useNavigate();
	const count = useRef(0);
	const days = ['월', '화', '수', '목', '금', '토', '일'];
	const classInfo = useSelector((state: RootState) => state.modal.data);

	useEffect(() => {
		console.log(classInfo);
		//load data
		// const newData = {
		//   title: data.title,
		// 	imageUrl: data.imageUrl,
		// 	startDate: data.startDate,
		// 	endDate: data.endDate,
		// }
		const newData = {
			title: '타이틀',
			imageUrl:
				'https://mywoo1031bucket.s3.ap-northeast-2.amazonaws.com/upload/Depth-First-Search.gif',
			startDate: '2022-04-01',
			endDate: '2022-04-30',
			day: '',
			startTime: '',
			endTime: '',
		};
		setInputs(newData);
		setSelectedDays([
			{ id: 0, day: 1, startTime: '05:30', endTime: '10:30' },
			{ id: 1, day: 3, startTime: '05:30', endTime: '10:30' },
		]);
	}, []);

	const loadClassInfo = () => {
		//받았다 하고
		//console.log(data);
		// if (classid) {
		// 	//const data = api.loadClassData(classid);
		// 	console.log(data, 'data');
		// setInputs(data);
		//}
	};

	const S3_BUCKET = process.env.REACT_APP_IMAGE_BUCKET;
	const ACCESS_KEY = process.env.REACT_APP_ACCESS_KEY;
	const SECRET_ACCESS_KEY = process.env.REACT_APP_SECRET_ACCESS_KEY;
	const REGION = process.env.REACT_APP_REGION;

	AWS.config.update({
		accessKeyId: ACCESS_KEY,
		secretAccessKey: SECRET_ACCESS_KEY,
	});

	const myBucket = new AWS.S3({
		params: { Bucket: S3_BUCKET },
		region: REGION,
	});

	const uploadFile = (e: any, file: any) => {
		e.preventDefault();
		const params = {
			ACL: 'public-read',
			Body: file,
			Bucket: S3_BUCKET as string,
			Key: 'upload/' + file.name,
		};
		myBucket
			.putObject(params)
			.on('httpUploadProgress', (evt: any, res: any) => {
				console.log('Uploaded : ' + (evt.loaded * 100) / evt.total) + '%';
				setInputs({
					...inputs,
					['imageUrl']:
						'https://mywoo1031bucket.s3.ap-northeast-2.amazonaws.com' +
						res.request.httpRequest.path,
				});
			})
			.on('httpDone', (res: any) => {
				console.log(res, 'httpDone');
				const newUrl: string =
					'https://mywoo1031bucket.s3.ap-northeast-2.amazonaws.com' +
					res.request.httpRequest.path;
				const classnum = createClass(newUrl);
				//navigate(`/classhome/${classnum.result.classid}/1`);
				//
			})
			.send((err) => {
				if (err) console.log(err, 'err');
			});
	};

	const createClass = (url: string) => {
		const classInfo = {
			title: inputs.title,
			imageUrl: url,
			startDate: inputs.startDate,
			endDate: inputs.endDate,
			times: [...selectedDays],
		};
		console.log(classInfo, 'classInfo');
		const response = api.createClass(classInfo);
		return response;
	};

	const onChange = (e: any) => {
		const { name, value } = e.target;
		setInputs({ ...inputs, [name]: value });
	};

	const addDays = (e: any) => {
		e.preventDefault();
		const newArr = [
			...selectedDays,
			{
				id: count.current,
				day: parseInt(inputs.day),
				startTime: inputs.startTime,
				endTime: inputs.endTime,
			},
		];
		count.current += 1;
		newArr.sort((a, b) => (a.day > b.day ? 1 : -1));
		setSelectedDays(newArr);
	};

	const deleteDay = (id: number) => {
		setSelectedDays(selectedDays.filter((day: any) => day.id !== id));
	};

	const handleFileOnChange = (event: any) => {
		event.preventDefault();
		const file = event.target.files[0];
		const reader = new FileReader();
		reader.onloadend = () => {
			setFile(file);
			const csv: string = reader.result as string;
			setInputs({ ...inputs, ['imageUrl']: csv });
			setIsImage(true);
		};
		if (file) {
			reader.readAsDataURL(file);
		}
	};

	return (
		<Form>
			<ModalCloseButton />
			<h2>클래스 수정하기</h2>
			<TopContainer>
				<p>강의 이름</p>
				<Input
					type='text'
					name='title'
					value={inputs.title}
					onChange={onChange}
				/>
			</TopContainer>
			<UpperContainer>
				<UpperLeft>
					<Days>
						<p>시작일</p>
						<InputDay
							type='date'
							name='startDate'
							value={inputs.startDate}
							onChange={onChange}
						/>
					</Days>
					<Days>
						<p>종료일</p>
						<InputDay
							type='date'
							name='endDate'
							value={inputs.endDate}
							onChange={onChange}
						/>
					</Days>
				</UpperLeft>
				<UpperRight>
					<p>사진 추가하기</p>
					<FileLabel htmlFor='file' src={inputs.imageUrl}>
						{isImage || <CrossButton />}
					</FileLabel>
					<FileInput type='file' id='file' onChange={handleFileOnChange} />
				</UpperRight>
			</UpperContainer>

			<LowerContainer>
				<AddBox>
					<BoxLeft>
						<DayList>
							{selectedDays.map((item: any) => (
								<DayNum key={item.id}>
									{days[item.day - 1]} [{item.startTime}~{item.endTime}]
									<DayButton
										src='/images/closeday.png'
										onClick={() => deleteDay(item.id)}
									/>
								</DayNum>
							))}
						</DayList>
					</BoxLeft>
					<BoxRight>
						<p>요일 선택</p>
						<DayContainer>
							<DayBox>
								{[1, 2, 3, 4, 5, 6, 7].map((day) => (
									<RadioBox key={day}>
										<Radio
											type='radio'
											name='day'
											value={day}
											onChange={onChange}
											id={days[day - 1]}
										/>
										<Label htmlFor={days[day - 1]}>{days[day - 1]}</Label>
									</RadioBox>
								))}
							</DayBox>

							<Button onClick={addDays}>추가</Button>
						</DayContainer>
						<InputDays>
							<Days>
								<p>시작 시간</p>
								<InputDay type='time' name='startTime' onChange={onChange} />
							</Days>
							<Days>
								<p>종료 시간</p>
								<InputDay type='time' name='endTime' onChange={onChange} />
							</Days>
						</InputDays>
					</BoxRight>
				</AddBox>
			</LowerContainer>
			<Footer>
				<AddButton onClick={(e) => uploadFile(e, file)}>수정하기</AddButton>
			</Footer>
		</Form>
	);
};

export default ModifyClass;

const Form = styled.form`
	width: 560px;
	height: 600px;
	display: flex;
	flex-direction: column;
	padding: 40px 50px 30px 50px;
	//justify-content: space-between;
`;
const TopContainer = styled.div`
	margin-top: 10px;
`;

const UpperContainer = styled.div`
	display: flex;
	flex-direction: row;
	justify-content: space-between;
`;
const Days = styled.div`
	margin-right: 10px;
	margin-top: 5px;
`;

const InputDays = styled.div`
	display: flex;
	flex-direction: column;
	justify-content: space-between;
	margin-top: 5px;
`;
const RadioBox = styled.div``;

const Radio = styled.input`
	display: none;
	&:checked + Label {
		color: ${({ theme }) => theme.colors.main};
		font-weight: 600;
	}
`;
const Label = styled.label`
	margin-right: 5px;
	cursor: pointer;
`;

const UpperLeft = styled.div`
	width: 250px;
	display: flex;
	flex-direction: column;
	justify-content: space-between;
`;

const UpperRight = styled.div`
	width: 180px;
	position: relative;
	display: flex;
	flex-direction: column;
	justify-content: space-between;
	margin-top: 10px;
`;
const FileInput = styled.input`
	position: absolute;
	width: 0;
	height: 0;
	padding: 0;
	overflow: hidden;
	border: 0;
`;
const FileLabel = styled.label<{ src: string }>`
	background-image: url(${({ src }) => src});
	${({ theme }) => theme.commons.backgroundImage};
	background-size: contain;
	background-color: ${({ theme }) => theme.colors.base};
	width: 100%;
	height: 100%;
	border-radius: 5px;
	cursor: pointer;
	box-shadow: 5px 5px 5px #ccc;
	&:hover {
		background-color: ${({ theme }) => theme.colors.hoverBase};
	}
	&:active {
		background-color: ${({ theme }) => theme.colors.activeBase};
	}
`;

const CrossButton = styled.div`
	border: none;
	background: none;
	background-image: url('images/crossbutton.png');
	background-repeat: no-repeat;
	background-position: center center;
	background-size: contain;
	width: 20px;
	height: 20px;
	top: 50%;
	left: 43%;
	position: absolute;
	cursor: pointer;
`;

const LowerContainer = styled.div`
	margin-top: 30px;
`;
const BoxRight = styled.div`
	margin-left: 10px;
`;

const BoxLeft = styled.div`
	width: 180px;
	height: 100%;
`;

const DayList = styled.div`
	display: flex;
	height: 100%;
	flex-direction: column;
	overflow: auto;
	&::-webkit-scrollbar {
		width: 5px;
	}
	&::-webkit-scrollbar-thumb {
		border-radius: 10px;
		background-color: ${({ theme }) => theme.colors.scroll};
	}
	&::-webkit-scrollbar-thumb:hover {
		background-color: ${({ theme }) => theme.colors.scrollHover};
	}
`;

const DayNum = styled.li`
	width: 160px;
	height: 30px;
	padding: 3px;
	border-radius: 10px;
	margin: 5px 0;
	text-align: center;
	align-items: center;
	${({ theme }) => theme.commons.mainButton};
	color: ${({ theme }) => theme.colors.buttonTitle};
`;

const DayButton = styled.button<{ src: string }>`
	border: none;
	background: none;
	background-image: url(${({ src }) => src});
	background-repeat: no-repeat;
	background-position: center center;
	background-size: contain;
	width: 10px;
	height: 10px;
	margin-left: 5px;
	cursor: pointer;
`;

const AddBox = styled.div`
	display: flex;
	flex-direction: row;
	justify-content: space-between;
	padding: 15px;
	height: 220px;
	background-color: ${({ theme }) => theme.colors.base};
`;

const DayContainer = styled.div`
	display: flex;
	flex-direction: row;
`;

const DayBox = styled.div`
	display: flex;
	padding: 5px;
	width: 160px;
	height: 30px;
	border-radius: 7px;
	align-items: center;
	justify-content: center;
	background-color: ${({ theme }) => theme.colors.background};
`;

const Input = styled.input`
	width: 100%;
	height: 30px;
	border-radius: 7px;
	border: none;
	background-color: ${({ theme }) => theme.colors.base};
	font-size: 14px;
	padding-left: 20px;
	outline: none;
`;

const InputDay = styled.input<{ type?: 'time' | 'date' }>`
	width: 100%;
	height: 30px;
	border-radius: 7px;
	border: none;
	background-color: ${({ theme }) => theme.colors.base};
	${({ type }) => type === 'time' && 'background-color: #FFF; color: #000;'}
	font-size: 14px;
	padding-left: 20px;
	outline: none;
	margin-top: 5px;
`;

const Footer = styled.div`
	margin-top: 20px;
	display: flex;
	justify-content: flex-end;
`;

const Button = styled.button`
	width: 70px;
	height: 30px;
	border-radius: 7px;
	border: none;
	background-color: ${({ theme }) => theme.colors.main};
	color: ${({ theme }) => theme.colors.buttonTitle};
	font-size: 12px;
	font-weight: 600;
	margin: 0 10px;
	cursor: pointer;
	&:hover {
		cursor: pointer;
		background-color: ${({ theme }) => theme.colors.brightMain};
	}
	&:active {
		background-color: ${({ theme }) => theme.colors.darkerMain};
	}
`;

const AddButton = styled(Button)`
	width: 165px;
	height: 35px;
	&:hover {
		cursor: pointer;
		background-color: ${({ theme }) => theme.colors.brightMain};
	}
	&:active {
		background-color: ${({ theme }) => theme.colors.darkerMain};
	}
`;